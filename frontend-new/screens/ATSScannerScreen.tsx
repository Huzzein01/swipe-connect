import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { atsScanResume, ATSResult } from '../services/aiService';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any; route?: any };

const readBase64 = async (asset: DocumentPicker.DocumentPickerAsset): Promise<{ base64: string; mimeType: string }> => {
  const mimeType = (asset as any).mimeType || 'application/octet-stream';
  try {
    if (Platform.OS === 'web' && (asset as any).file && typeof FileReader !== 'undefined') {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL((asset as any).file);
      });
      return { base64, mimeType };
    }
    if (asset.uri) {
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      return { base64, mimeType };
    }
  } catch { /* ignore */ }
  return { base64: '', mimeType };
};

const scoreColor = (theme: any, score: number) =>
  score >= 80 ? theme.success : score >= 60 ? theme.warning : theme.destructive;

const ATSScannerScreen = ({ navigation, route }: Props) => {
  const { theme } = useTheme();
  const { profile } = useUserProfile();
  const [targetRole, setTargetRole] = useState(profile.title || '');
  const [scanning, setScanning] = useState(false);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ATSResult | null>(route?.params?.result ?? null);
  const [error, setError] = useState('');

  const runScan = async (payload: { base64?: string; mimeType?: string; name?: string }) => {
    setScanning(true);
    setError('');
    try {
      const res = await atsScanResume({ ...payload, targetRole: targetRole.trim() || undefined });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not scan this resume. Make sure it has readable text and try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleAttach = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'text/markdown', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });
      if (picked.canceled || !picked.assets?.length) return;
      const asset = picked.assets[0];
      setFileName(asset.name);
      setResult(null);
      const { base64, mimeType } = await readBase64(asset);
      if (!base64) { setError('Could not read that file. Try a PDF or .txt.'); return; }
      await runScan({ base64, mimeType, name: asset.name });
    } catch {
      setError('File selection failed. Please try again.');
    }
  };

  const sc = result ? scoreColor(theme, result.score) : theme.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>ATS Resume Scanner</Text>
          <Text style={[styles.headerSub, { color: theme.mutedForeground }]}>Score your resume &amp; get fixes</Text>
        </View>
        <View style={[styles.premiumTag, { backgroundColor: `${theme.primary}15` }]}>
          <Ionicons name="shield-checkmark" size={12} color={theme.primary} />
          <Text style={[styles.premiumTagText, { color: theme.primary }]}>ATS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
        {/* Intro / attach */}
        {!result && (
          <>
            <View style={[styles.infoBanner, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}25` }]}>
              <Ionicons name="scan-outline" size={20} color={theme.primary} />
              <Text style={[styles.infoText, { color: theme.foreground }]}>
                Attach your existing resume and we'll score it for ATS readiness, then give you specific, actionable improvements — no rebuilding required.
              </Text>
            </View>

            <Text style={[styles.label, { color: theme.mutedForeground }]}>Target role (optional, sharpens keyword scoring)</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.foreground }]}
              value={targetRole}
              onChangeText={setTargetRole}
              placeholder="e.g. Data Analyst"
              placeholderTextColor={theme.mutedForeground}
            />

            <TouchableOpacity
              style={[styles.attachBtn, { backgroundColor: theme.primary }, scanning && { opacity: 0.6 }]}
              onPress={handleAttach}
              disabled={scanning}
              activeOpacity={0.85}
            >
              {scanning
                ? <><ActivityIndicator color="#fff" /><Text style={styles.attachBtnText}>Scanning…</Text></>
                : <><Ionicons name="cloud-upload-outline" size={20} color="#fff" /><Text style={styles.attachBtnText}>Attach resume &amp; scan</Text></>
              }
            </TouchableOpacity>
            {fileName ? <Text style={[styles.fileName, { color: theme.mutedForeground }]}>{fileName}</Text> : null}
            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: `${theme.destructive}12`, borderColor: `${theme.destructive}40` }]}>
                <Ionicons name="alert-circle-outline" size={16} color={theme.destructive} />
                <Text style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
              </View>
            ) : null}
          </>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Score gauge */}
            <View style={[styles.scoreCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.scoreCircle, { borderColor: sc }]}>
                <Text style={[styles.scoreNum, { color: sc }]}>{result.score}</Text>
                <Text style={[styles.scoreOf, { color: theme.mutedForeground }]}>/100</Text>
              </View>
              <Text style={[styles.rating, { color: sc }]}>{result.rating}</Text>
              <Text style={[styles.summary, { color: theme.mutedForeground }]}>{result.summary}</Text>
              <TouchableOpacity style={[styles.rescanBtn, { borderColor: theme.border }]} onPress={() => { setResult(null); setFileName(''); }}>
                <Ionicons name="refresh" size={14} color={theme.primary} />
                <Text style={[styles.rescanText, { color: theme.primary }]}>Scan another</Text>
              </TouchableOpacity>
            </View>

            {/* Category breakdown */}
            {result.breakdown.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.foreground }]}>Score breakdown</Text>
                {result.breakdown.map((b, i) => {
                  const pct = b.max > 0 ? Math.round((b.score / b.max) * 100) : 0;
                  const bc = scoreColor(theme, pct);
                  return (
                    <View key={i} style={styles.breakRow}>
                      <View style={styles.breakHead}>
                        <Text style={[styles.breakCat, { color: theme.foreground }]}>{b.category}</Text>
                        <Text style={[styles.breakScore, { color: bc }]}>{b.score}/{b.max}</Text>
                      </View>
                      <View style={[styles.breakBar, { backgroundColor: theme.muted }]}>
                        <View style={[styles.breakFill, { width: `${pct}%` as any, backgroundColor: bc }]} />
                      </View>
                      {b.note ? <Text style={[styles.breakNote, { color: theme.mutedForeground }]}>{b.note}</Text> : null}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.foreground }]}>What's working</Text>
                {result.strengths.map((s, i) => (
                  <View key={i} style={styles.listRow}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.success} />
                    <Text style={[styles.listText, { color: theme.foreground }]}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Improvements */}
            {result.improvements.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.foreground }]}>How to improve</Text>
                {result.improvements.map((s, i) => (
                  <View key={i} style={styles.listRow}>
                    <View style={[styles.numBadge, { backgroundColor: `${theme.primary}15` }]}>
                      <Text style={[styles.numBadgeText, { color: theme.primary }]}>{i + 1}</Text>
                    </View>
                    <Text style={[styles.listText, { color: theme.foreground }]}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Missing keywords */}
            {result.missingKeywords.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.cardTitle, { color: theme.foreground }]}>Keywords worth adding</Text>
                <View style={styles.kwRow}>
                  {result.missingKeywords.map((k) => (
                    <View key={k} style={[styles.kw, { backgroundColor: `${theme.warning}15` }]}>
                      <Text style={[styles.kwText, { color: theme.warning }]}>{k}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.builderBtn, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('ResumeBuilder')}
              activeOpacity={0.85}
            >
              <Ionicons name="construct-outline" size={18} color="#fff" />
              <Text style={styles.attachBtnText}>Build an improved resume</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  headerSub: { fontSize: FontSize.xs, marginTop: 2 },
  premiumTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  premiumTagText: { fontSize: 10, fontWeight: FontWeight.extrabold },
  scroll: { padding: Spacing.xl },
  infoBanner: { flexDirection: 'row', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.xl, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: Spacing.sm },
  input: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, minHeight: 44, marginBottom: Spacing.xl },
  attachBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: BorderRadius.lg },
  attachBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  fileName: { fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.md },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.lg },
  errorText: { flex: 1, fontSize: FontSize.sm },
  scoreCard: { borderWidth: 1, borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], alignItems: 'center', marginBottom: Spacing.lg },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  scoreNum: { fontSize: 44, fontWeight: FontWeight.extrabold },
  scoreOf: { fontSize: FontSize.md, marginLeft: 2, marginBottom: 8 },
  rating: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginTop: Spacing.md },
  summary: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, marginTop: Spacing.sm },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, marginTop: Spacing.lg },
  rescanText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  card: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  cardTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.md },
  breakRow: { marginBottom: Spacing.md },
  breakHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  breakCat: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  breakScore: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  breakBar: { height: 7, borderRadius: 4, overflow: 'hidden' },
  breakFill: { height: '100%', borderRadius: 4 },
  breakNote: { fontSize: FontSize.xs, marginTop: 4, lineHeight: 17 },
  listRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md, alignItems: 'flex-start' },
  listText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  numBadge: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  numBadgeText: { fontSize: 11, fontWeight: FontWeight.bold },
  kwRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  kw: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  kwText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  builderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 52, borderRadius: BorderRadius.lg, marginTop: Spacing.sm },
});

export default ATSScannerScreen;
