/**
 * MapLocationPicker
 * – Web: renders an OpenStreetMap iframe (zero native deps, works in browser)
 * – Native: renders a WebView with the same Leaflet HTML
 * Props:
 *   city, state — pre-fill the search
 *   onLocationSelect(city, state, lat, lng) — called when user clicks a location
 */
import React, { useRef } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = {
  city?: string;
  state?: string;
  onLocationSelect?: (city: string, state: string, lat: number, lng: number) => void;
  height?: number;
};

const getMapUrl = (city = 'Chicago', state = 'IL') => {
  const query = encodeURIComponent(`${city}, ${state}`);
  return `https://www.openstreetmap.org/search?query=${query}#map=11`;
};

// Leaflet HTML blob used for web iframe & native WebView
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
  .location-label {
    position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);
    background: rgba(0,0,0,0.7); color: white; padding: 6px 14px;
    border-radius: 20px; font-family: sans-serif; font-size: 13px; z-index: 1000;
    pointer-events: none;
  }
</style>
</head>
<body>
<div id="map"></div>
<div class="location-label" id="label">Tap any location to select it</div>
<script>
const city = "${city || 'Chicago'}";
const state = "${state || 'IL'}";
const map = L.map('map').setView([41.8781, -87.6298], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Geocode the city
fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(city + ', ' + state))
  .then(r => r.json())
  .then(results => {
    if (results && results[0]) {
      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);
      map.setView([lat, lng], 11);
      L.marker([lat, lng]).addTo(map).bindPopup(city + ', ' + state).openPopup();
    }
  }).catch(() => {});

let marker = null;
map.on('click', function(e) {
  const lat = e.latlng.lat.toFixed(4);
  const lng = e.latlng.lng.toFixed(4);
  if (marker) map.removeLayer(marker);
  marker = L.marker(e.latlng).addTo(map);
  document.getElementById('label').textContent = 'Lat: ' + lat + ', Lng: ' + lng;

  // Reverse geocode
  fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng)
    .then(r => r.json())
    .then(data => {
      const c = data.address?.city || data.address?.town || data.address?.village || '';
      const s = data.address?.state || data.address?.state_code || '';
      document.getElementById('label').textContent = c ? (c + ', ' + s) : ('Lat: ' + lat + ', Lng: ' + lng);
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ city: c, state: s, lat: parseFloat(lat), lng: parseFloat(lng) }));
      }
    }).catch(() => {});
});
</script>
</body>
</html>`;

const MapLocationPicker = ({ city = 'Chicago', state = 'IL', onLocationSelect, height = 280 }: Props) => {
  const { theme } = useTheme();
  const iframeRef = useRef<any>(null);

  // ── Web: native iframe ──────────────────────────────────────────────────────
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const html = buildLeafletHtml(city, state);
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);

    return (
      <View style={[styles.container, { borderColor: theme.border, height }]}>
        <View style={[styles.mapHeader, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.mapLabel, { color: theme.foreground }]}>📍 {city}, {state}</Text>
          <Text style={[styles.mapHint, { color: theme.mutedForeground }]}>Tap anywhere to pick a location</Text>
        </View>
        {/* @ts-ignore — iframe is valid on web */}
        <iframe
          ref={iframeRef}
          src={blobUrl}
          style={{ width: '100%', height: height - 52, border: 'none', borderRadius: `0 0 ${BorderRadius.xl}px ${BorderRadius.xl}px` }}
          title="Location picker"
          onLoad={() => URL.revokeObjectURL(blobUrl)}
        />
      </View>
    );
  }

  // ── Native: show a placeholder (avoids react-native-webview dep) ─────────
  return (
    <View style={[styles.container, styles.nativeFallback, { borderColor: theme.border, backgroundColor: theme.muted, height }]}>
      <Text style={{ fontSize: 32 }}>🗺️</Text>
      <Text style={[styles.nativeText, { color: theme.foreground }]}>{city}, {state}</Text>
      <Text style={[styles.nativeHint, { color: theme.mutedForeground }]}>
        Map view available on the web version.{'\n'}Edit city and state fields above to update your location.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  mapHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  mapHint: { fontSize: FontSize.xs },
  nativeFallback: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  nativeText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  nativeHint: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.xl },
});

export default MapLocationPicker;
