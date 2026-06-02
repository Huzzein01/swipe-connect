import React from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNetwork } from '../contexts/NetworkContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any; route: any };

const ConnectionProfileScreen = ({ navigation, route }: Props) => {
  const { theme } = useTheme();
  const { matches } = useNetwork();
  const { profileId } = route.params as { profileId: string };

  const match = matches.find((m) => m.profile.id === profileId);
  const profile = match?.profile;

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Profile</Text>
        </View>
        <View style={styles.center}>
          <Text style={{ color: theme.mutedForeground }}>Connection not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const Tag = ({ label, color }: { label: string; color: string }) => (
    <View style={[styles.tag, { backgroundColor: `${color}15` }]}>
      <Text style={[styles.tagText, { color }]}>{label}</Text>
    </View>
  );

  const Section = ({ title, icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) => (
    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.sectionHead}>
        <Ionicons name={icon} size={16} color={color} />
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>Connection</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.avatar, { backgroundColor: `${theme.accent}20`, borderColor: `${theme.accent}40` }]}>
            <Text style={[styles.avatarText, { color: theme.accent }]}>{profile.avatar}</Text>
          </View>
          <Text style={[styles.name, { color: theme.foreground }]}>{profile.name}</Text>
          <Text style={[styles.title, { color: theme.accent }]}>{profile.title}</Text>
          <Text style={[styles.sub, { color: theme.mutedForeground }]}>{profile.company} · {profile.location}</Text>

          <View style={[styles.matchPill, { backgroundColor: `${theme.success}15` }]}>
            <Ionicons name="git-network-outline" size={13} color={theme.success} />
            <Text style={[styles.matchPillText, { color: theme.success }]}>{profile.matchScore}% compatibility</Text>
          </View>

          {/* Message CTA */}
          <TouchableOpacity
            style={[styles.messageBtn, { backgroundColor: theme.accent }]}
            onPress={() => navigation.navigate('Chat', { matchId: match.id })}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.messageBtnText}>Message {profile.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <Section title="About" icon="person-outline" color={theme.accent}>
            <Text style={[styles.body, { color: theme.mutedForeground }]}>{profile.bio}</Text>
          </Section>
        ) : null}

        {/* Looking for */}
        {profile.lookingFor ? (
          <Section title="Looking for" icon="search-outline" color={theme.primary}>
            <Text style={[styles.body, { color: theme.foreground }]}>{profile.lookingFor}</Text>
          </Section>
        ) : null}

        {/* Experience */}
        {profile.experience ? (
          <Section title="Experience" icon="briefcase-outline" color={theme.secondary}>
            <Text style={[styles.body, { color: theme.foreground }]}>{profile.experience}</Text>
          </Section>
        ) : null}

        {/* Project ideas */}
        {profile.projectIdeas?.length > 0 && (
          <Section title="Project ideas" icon="bulb-outline" color={theme.warning}>
            {profile.projectIdeas.map((idea) => (
              <View key={idea} style={styles.ideaRow}>
                <Ionicons name="ellipse" size={6} color={theme.warning} style={{ marginTop: 7 }} />
                <Text style={[styles.body, { color: theme.foreground, flex: 1 }]}>{idea}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Skills */}
        {profile.skills?.length > 0 && (
          <Section title="Skills" icon="construct-outline" color={theme.primary}>
            <View style={styles.tagRow}>
              {profile.skills.map((s) => <Tag key={s} label={s} color={theme.primary} />)}
            </View>
          </Section>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <Section title="Interests" icon="heart-outline" color={theme.accent}>
            <View style={styles.tagRow}>
              {profile.interests.map((i) => <Tag key={i} label={i} color={theme.accent} />)}
            </View>
          </Section>
        )}

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingBottom: 140, gap: Spacing.md },
  hero: { borderWidth: 1, borderRadius: BorderRadius['2xl'], padding: Spacing['2xl'], alignItems: 'center', marginBottom: Spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  avatarText: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold },
  name: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, textAlign: 'center' },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, marginTop: 2, textAlign: 'center' },
  sub: { fontSize: FontSize.sm, marginTop: 4, textAlign: 'center' },
  matchPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginTop: Spacing.md },
  matchPillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  messageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderRadius: BorderRadius.full, paddingHorizontal: Spacing['2xl'], paddingVertical: Spacing.md, marginTop: Spacing.lg, alignSelf: 'stretch' },
  messageBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  section: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, textTransform: 'uppercase', letterSpacing: 0.4 },
  body: { fontSize: FontSize.sm, lineHeight: 21 },
  ideaRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
});

export default ConnectionProfileScreen;
