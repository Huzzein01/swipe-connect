/**
 * MapLocationPicker
 * Drag-and-drop pin location picker.
 * – Web: OpenStreetMap/Leaflet in an iframe; a draggable pin posts the
 *   resolved city/state back to the parent via postMessage.
 * – Native: lightweight placeholder (no react-native-webview dependency).
 *
 * onLocationSelect(city, state, lat, lng) fires whenever the user drops or
 * drags the pin, or taps a new spot on the map.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = {
  city?: string;
  state?: string;
  onLocationSelect?: (city: string, state: string, lat: number, lng: number) => void;
  height?: number;
};

const buildLeafletHtml = (city: string, state: string) => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; }
  .pin-label {
    position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
    background: rgba(15,23,42,0.92); color: #fff; padding: 8px 16px;
    border-radius: 20px; font-family: -apple-system, system-ui, sans-serif;
    font-size: 13px; font-weight: 600; z-index: 1000; pointer-events: none;
    max-width: 90%; text-align: center; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .hint {
    position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
    background: rgba(29,78,216,0.95); color: #fff; padding: 6px 14px;
    border-radius: 16px; font-family: -apple-system, system-ui, sans-serif;
    font-size: 12px; font-weight: 600; z-index: 1000; pointer-events: none;
  }
</style>
</head>
<body>
<div id="map"></div>
<div class="hint" id="hint">📍 Drag the pin or tap to set location</div>
<div class="pin-label" id="label">Locating…</div>
<script>
  var initCity = ${JSON.stringify(city || 'Chicago')};
  var initState = ${JSON.stringify(state || 'IL')};
  var map = L.map('map', { zoomControl: true }).setView([41.8781, -87.6298], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 18
  }).addTo(map);

  var marker = L.marker([41.8781, -87.6298], { draggable: true }).addTo(map);

  function send(payload) {
    var msg = JSON.stringify(Object.assign({ source: 'swipeconnect-map' }, payload));
    try { if (window.parent) window.parent.postMessage(msg, '*'); } catch (e) {}
    try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg); } catch (e) {}
  }

  function resolve(lat, lng) {
    document.getElementById('label').textContent = 'Locating…';
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng, {
      headers: { 'Accept-Language': 'en' }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var a = data.address || {};
        var c = a.city || a.town || a.village || a.county || a.suburb || '';
        var s = a.state || a.region || '';
        var labelText = c ? (c + (s ? ', ' + s : '')) : (Number(lat).toFixed(3) + ', ' + Number(lng).toFixed(3));
        document.getElementById('label').textContent = '📍 ' + labelText;
        send({ city: c, state: s, lat: lat, lng: lng });
      })
      .catch(function () {
        document.getElementById('label').textContent = '📍 ' + Number(lat).toFixed(3) + ', ' + Number(lng).toFixed(3);
        send({ city: '', state: '', lat: lat, lng: lng });
      });
  }

  function moveTo(lat, lng, zoom) {
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], zoom || map.getZoom());
    resolve(lat, lng);
  }

  // Geocode the initial city
  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(initCity + ', ' + initState))
    .then(function (r) { return r.json(); })
    .then(function (results) {
      if (results && results[0]) {
        moveTo(parseFloat(results[0].lat), parseFloat(results[0].lon), 11);
      } else {
        resolve(41.8781, -87.6298);
      }
    })
    .catch(function () { resolve(41.8781, -87.6298); });

  // Drag the pin
  marker.on('dragend', function () {
    var p = marker.getLatLng();
    resolve(p.lat, p.lng);
  });

  // Tap the map to move the pin
  map.on('click', function (e) {
    marker.setLatLng(e.latlng);
    resolve(e.latlng.lat, e.latlng.lng);
  });
</script>
</body>
</html>`;

const MapLocationPicker = ({ city = 'Chicago', state = 'IL', onLocationSelect, height = 300 }: Props) => {
  const { theme } = useTheme();
  const callbackRef = useRef(onLocationSelect);
  const [pinned, setPinned] = useState<string>('');

  // Keep latest callback without re-rendering the iframe
  useEffect(() => { callbackRef.current = onLocationSelect; }, [onLocationSelect]);

  // Listen for messages from the iframe (web only)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = (event: MessageEvent) => {
      let data: any = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!data || data.source !== 'swipeconnect-map') return;
      if (data.city) setPinned(`${data.city}${data.state ? ', ' + data.state : ''}`);
      callbackRef.current?.(data.city || '', data.state || '', data.lat, data.lng);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Build the iframe src once per initial city/state (not on every pin move)
  const srcRef = useRef<string>('');
  if (Platform.OS === 'web' && typeof document !== 'undefined' && !srcRef.current) {
    const html = buildLeafletHtml(city, state);
    const blob = new Blob([html], { type: 'text/html' });
    srcRef.current = URL.createObjectURL(blob);
  }

  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return (
      <View style={[styles.container, { borderColor: theme.border, height }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.headerLabel, { color: theme.foreground }]} numberOfLines={1}>
            {pinned ? `📍 ${pinned}` : `📍 ${city}, ${state}`}
          </Text>
          <Text style={[styles.headerHint, { color: theme.mutedForeground }]}>Drag pin to set</Text>
        </View>
        {/* @ts-ignore — iframe is valid on web */}
        <iframe
          src={srcRef.current}
          style={{ width: '100%', height: height - 50, border: 'none' }}
          title="Location picker"
        />
      </View>
    );
  }

  // Native placeholder
  return (
    <View style={[styles.container, styles.native, { borderColor: theme.border, backgroundColor: theme.muted, height }]}>
      <Text style={{ fontSize: 32 }}>🗺️</Text>
      <Text style={[styles.nativeText, { color: theme.foreground }]}>{pinned || `${city}, ${state}`}</Text>
      <Text style={[styles.nativeHint, { color: theme.mutedForeground }]}>
        Interactive map is available on the web app.{'\n'}Edit the city/state fields above to set your location.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, flex: 1, marginRight: Spacing.sm },
  headerHint: { fontSize: FontSize.xs },
  native: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  nativeText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  nativeHint: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.xl },
});

export default MapLocationPicker;
