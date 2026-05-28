import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type HomeScreenProps = {
  navigation: any;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, logout } = useAuth();
  const { highFitJobs, stats, resume } = useDemo();
  const { theme } = useTheme();
  const demoDeckSize = 1000;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const quickActions = [
    {
      title: 'Discover jobs',
      subtitle: 'Review curated roles one card at a time',
      icon: 'heart' as const,
      color: theme.primary,
      onPress: () => navigation.navigate('Jobs'),
    },
    {
      title: 'Tune preferences',
      subtitle: 'Location, seniority, remote, and role types',
      icon: 'options' as const,
      color: theme.secondary,
      onPress: () => navigation.navigate('JobFilters'),
    },
    {
      title: 'Improve resume',
      subtitle: 'Upload once and power smarter matching',
      icon: 'document-text' as const,
      color: theme.accent,
      onPress: () => navigation.navigate('ResumeUpload'),
    },
  ];

  const pipeline = [
    { label: 'Job deck', value: demoDeckSize.toLocaleString(), icon: 'sparkles-outline' as const },
    { label: 'Applied', value: stats.applied.toString(), icon: 'send-outline' as const },
    { label: 'Saved', value: stats.saved.toString(), icon: 'bookmark-outline' as const },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.identity}>
            <Image
              source={{ uri: user?.photoURL || 'https://via.placeholder.com/96' }}
              style={[styles.avatar, { borderColor: theme.border }]}
            />
            <View style={styles.identityText}>
              <Text style={[styles.eyebrow, { color: theme.mutedForeground }]}>SwipeConnect</Text>
              <Text style={[styles.name, { color: theme.foreground }]} numberOfLines={1}>
                {user?.displayName || 'Welcome back'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.heroPanel, { backgroundColor: theme.foreground }]}>
          <View style={styles.heroCopy}>
            <Text style={[styles.heroKicker, { color: theme.accent }]}>Today's shortlist</Text>
            <Text style={[styles.heroTitle, { color: theme.background }]}>
              {demoDeckSize.toLocaleString()} roles ready to swipe
            </Text>
            <Text style={[styles.heroText, { color: `${theme.background}CC` }]}>
              {resume
                ? 'Updated from your resume, preferred locations, and recent swipe behavior.'
                : 'Upload a resume to make the matching engine sharper.'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.heroButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.navigate('Jobs')}
            activeOpacity={0.85}
          >
            <Text style={[styles.heroButtonText, { color: theme.primaryForeground }]}>Start</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.primaryForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.pipelineRow}>
          {pipeline.map((item, index) => (
            <View
              key={item.label}
              style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: index === 0 ? `${theme.primary}14` : index === 1 ? `${theme.accent}16` : `${theme.secondary}14` },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={index === 0 ? theme.primary : index === 1 ? theme.accent : theme.secondary}
                />
              </View>
              <Text style={[styles.metricValue, { color: theme.foreground }]}>{item.value}</Text>
              <Text style={[styles.metricLabel, { color: theme.mutedForeground }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Quick Actions</Text>
            <Text style={[styles.sectionMeta, { color: theme.mutedForeground }]}>3 steps</Text>
          </View>
          <View style={styles.actionStack}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.title}
                style={[styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={action.onPress}
                activeOpacity={0.72}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}16` }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionTitle, { color: theme.foreground }]}>{action.title}</Text>
                  <Text style={[styles.actionSubtitle, { color: theme.mutedForeground }]} numberOfLines={2}>
                    {action.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>High-Fit Roles</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Jobs')} activeOpacity={0.7}>
              <Text style={[styles.linkText, { color: theme.primary }]}>Review</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.matchStack}>
            {highFitJobs.map((job) => (
              <View key={job.id} style={[styles.matchCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.matchTop}>
                  <View style={styles.matchTitleBlock}>
                    <Text style={[styles.matchRole, { color: theme.foreground }]}>{job.title}</Text>
                    <Text style={[styles.matchCompany, { color: theme.mutedForeground }]}>{job.company}</Text>
                  </View>
                  <View style={[styles.fitBadge, { backgroundColor: `${theme.success}15` }]}>
                    <Text style={[styles.fitText, { color: theme.success }]}>{job.matchScore}%</Text>
                  </View>
                </View>
                <Text style={[styles.matchDetail, { color: theme.mutedForeground }]}>
                  {job.whyMatch.join(', ')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    marginRight: Spacing.md,
  },
  identityText: { flex: 1 },
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginBottom: 2,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPanel: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    marginBottom: Spacing.lg,
  },
  heroCopy: { marginBottom: Spacing.xl },
  heroKicker: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.extrabold,
    lineHeight: 36,
    marginBottom: Spacing.sm,
  },
  heroText: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  heroButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  heroButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  pipelineRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  metricValue: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  sectionMeta: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  actionStack: {
    gap: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionText: { flex: 1 },
  actionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: FontSize.sm,
    lineHeight: 19,
  },
  linkText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  matchStack: {
    gap: Spacing.md,
  },
  matchCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  matchTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  matchTitleBlock: { flex: 1 },
  matchRole: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  matchCompany: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  fitBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  fitText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  matchDetail: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});

export default HomeScreen;
