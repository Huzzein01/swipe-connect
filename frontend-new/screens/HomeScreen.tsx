import React from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  SafeAreaView, ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { useNetwork } from '../contexts/NetworkContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any };

const HomeScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const { stats, resume } = useDemo();
  const { matches } = useNetwork();
  const { profile } = useUserProfile();
  const { theme, isDark } = useTheme();

  const displayName = profile.displayName || user?.displayName || 'there';
  const photoUri = profile.photoUri || user?.photoURL || '';
  const initials = displayName
    .split(/[ @._-]/).filter(Boolean).slice(0, 2)
    .map((p: string) => p.charAt(0).toUpperCase()).join('') || 'SC';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={true}>

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={[styles.avatar, { borderColor: theme.primary }]} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: `${theme.primary}18`, borderColor: theme.primary }]}>
                <Text style={[styles.avatarInitials, { color: theme.primary }]}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.greetBlock}>
            <Text style={[styles.greetSub, { color: theme.mutedForeground }]}>{greeting} 👋</Text>
            <Text style={[styles.greetName, { color: theme.foreground }]} numberOfLines={1}>{displayName}</Text>
          </View>
        </View>

        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <View style={[styles.heroBanner, { backgroundColor: theme.primary }]}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroEye}>Live jobs · Updated now</Text>
            <Text style={styles.heroTitle}>Find your{'\n'}next role</Text>
            <Text style={styles.heroSub}>
              {resume
                ? 'Your resume is powering AI match scores.'
                : 'Upload a resume to activate AI scoring.'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={20} color={theme.primary} />
          </TouchableOpacity>
          {/* decorative circles */}
          <View style={[styles.decoCircle1, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          <View style={[styles.decoCircle2, { backgroundColor: 'rgba(255,255,255,0.07)' }]} />
        </View>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Applied', value: stats.applied, icon: 'send-outline' as const, color: theme.success, bg: `${theme.success}12` },
            { label: 'Saved', value: stats.saved, icon: 'bookmark-outline' as const, color: theme.secondary, bg: `${theme.secondary}12` },
            { label: 'Connections', value: matches.length, icon: 'git-network-outline' as const, color: theme.accent, bg: `${theme.accent}12` },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={18} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Mode cards ───────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Explore</Text>
        </View>

        <View style={styles.modeRow}>
          {/* Jobs card */}
          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardLeft, { backgroundColor: isDark ? '#1e1025' : '#FFF0F7', borderColor: `${theme.primary}30` }]}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.82}
          >
            <View style={[styles.modeIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="briefcase" size={22} color="#fff" />
            </View>
            <Text style={[styles.modeLabel, { color: theme.foreground }]}>Jobs</Text>
            <Text style={[styles.modeSub, { color: theme.mutedForeground }]}>Swipe live roles from 60+ companies</Text>
            <View style={[styles.modeArrow, { backgroundColor: theme.primary }]}>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Networking card */}
          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardRight, { backgroundColor: isDark ? '#0e1c25' : '#F0FBFF', borderColor: `${theme.accent}30` }]}
            onPress={() => navigation.navigate('Discover')}
            activeOpacity={0.82}
          >
            <View style={[styles.modeIcon, { backgroundColor: theme.accent }]}>
              <Ionicons name="git-network" size={22} color="#fff" />
            </View>
            <Text style={[styles.modeLabel, { color: theme.foreground }]}>Network</Text>
            <Text style={[styles.modeSub, { color: theme.mutedForeground }]}>Connect with founders & builders</Text>
            <View style={[styles.modeArrow, { backgroundColor: theme.accent }]}>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Quick actions</Text>
        </View>

        <View style={[styles.actionsList, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {[
            {
              icon: 'document-text-outline' as const,
              color: theme.accent,
              label: resume ? 'Resume uploaded' : 'Upload resume',
              sub: resume ? 'AI scoring is active' : 'Unlock AI match scoring',
              screen: 'ResumeUpload',
              badge: resume ? '✓' : null,
            },
            {
              icon: 'scan-outline' as const,
              color: theme.accent,
              label: 'ATS Resume Scanner',
              sub: 'Score your resume & get fixes',
              screen: 'ATSScanner',
              badge: null,
            },
            {
              icon: 'options-outline' as const,
              color: theme.secondary,
              label: 'Job preferences',
              sub: 'Location, type, seniority',
              screen: 'JobFilters',
              badge: null,
            },
            {
              icon: 'sparkles-outline' as const,
              color: theme.primary,
              label: 'AI Resume Tailor',
              sub: 'Premium — enable in Settings',
              screen: 'Settings',
              badge: 'PRO',
            },
            {
              icon: 'person-outline' as const,
              color: theme.warning,
              label: 'Complete your profile',
              sub: 'Photo, skills, networking goals',
              screen: 'Profile',
              badge: null,
            },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionLabel, { color: theme.foreground }]}>{item.label}</Text>
                  <Text style={[styles.actionSub, { color: theme.mutedForeground }]}>{item.sub}</Text>
                </View>
                {item.badge ? (
                  <View style={[styles.actionBadge, { backgroundColor: item.badge === '✓' ? `${theme.success}15` : `${theme.primary}15` }]}>
                    <Text style={[styles.actionBadgeText, { color: item.badge === '✓' ? theme.success : theme.primary }]}>{item.badge}</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={theme.mutedForeground} />
                )}
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Resume prompt if missing ──────────────────────────────────── */}
        {!resume && (
          <TouchableOpacity
            style={[styles.resumePrompt, { backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}30` }]}
            onPress={() => navigation.navigate('ResumeUpload')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles-outline" size={20} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resumePromptTitle, { color: theme.foreground }]}>Activate AI match scoring</Text>
              <Text style={[styles.resumePromptSub, { color: theme.mutedForeground }]}>Upload your resume to get real AI analysis on every job card</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={theme.accent} />
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 140 },
  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, marginBottom: Spacing.xl },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold },
  greetBlock: { flex: 1 },
  greetSub: { fontSize: FontSize.sm, marginBottom: 2 },
  greetName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  // Hero banner
  heroBanner: {
    marginHorizontal: Spacing.xl, borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'], marginBottom: Spacing.xl,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  heroLeft: { flex: 1 },
  heroEye: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, letterSpacing: 0.5 },
  heroTitle: { color: '#fff', fontSize: FontSize['3xl'], fontWeight: FontWeight.extrabold, lineHeight: 38, marginBottom: Spacing.sm },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm, lineHeight: 19 },
  heroBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  decoCircle1: { position: 'absolute', width: 160, height: 160, borderRadius: 80, right: -40, top: -50, pointerEvents: 'none' },
  decoCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, right: 40, bottom: -30, pointerEvents: 'none' },
  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  statCard: { flex: 1, borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, alignItems: 'flex-start' },
  statIconBox: { width: 34, height: 34, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  // Section head
  sectionHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  // Mode cards
  modeRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  modeCard: { flex: 1, borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg, position: 'relative' },
  modeCardLeft: {},
  modeCardRight: {},
  modeIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  modeLabel: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold, marginBottom: 4 },
  modeSub: { fontSize: FontSize.xs, lineHeight: 17, marginBottom: Spacing.lg },
  modeArrow: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  // Actions list
  actionsList: { marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: Spacing.xl, overflow: 'hidden' },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  actionIcon: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1 },
  actionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  actionSub: { fontSize: FontSize.sm, marginTop: 2 },
  actionBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  actionBadgeText: { fontSize: 11, fontWeight: FontWeight.extrabold },
  actionDivider: { height: 1, marginLeft: 72 },
  // Resume prompt
  resumePrompt: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg },
  resumePromptTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 2 },
  resumePromptSub: { fontSize: FontSize.sm, lineHeight: 18 },
});

export default HomeScreen;
