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
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type HomeScreenProps = {
  navigation: any;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const quickActions = [
    {
      title: 'Start Swiping',
      subtitle: 'Browse jobs that match you',
      icon: 'heart' as const,
      iconBg: `${theme.primary}18`,
      iconColor: theme.primary,
      onPress: () => navigation.navigate('Jobs'),
    },
    {
      title: 'Upload Resume',
      subtitle: 'Let AI parse your background',
      icon: 'document-text' as const,
      iconBg: `${theme.accent}18`,
      iconColor: theme.accent,
      onPress: () => navigation.navigate('ResumeUpload'),
    },
    {
      title: 'Job Preferences',
      subtitle: 'Refine your matching criteria',
      icon: 'options' as const,
      iconBg: `${theme.secondary}18`,
      iconColor: theme.secondary,
      onPress: () => navigation.navigate('JobFilters'),
    },
  ];

  const stats = [
    { label: 'Matches', value: '0', color: theme.primary },
    { label: 'Applied', value: '0', color: theme.accent },
    { label: 'Saved', value: '0', color: theme.secondary },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileRow}>
            <Image
              source={{ uri: user?.photoURL || 'https://via.placeholder.com/80' }}
              style={[styles.avatar, { borderColor: theme.primary }]}
            />
            <View style={styles.profileText}>
              <Text style={[styles.greeting, { color: theme.mutedForeground }]}>
                Welcome back,
              </Text>
              <Text style={[styles.userName, { color: theme.foreground }]}>
                {user?.displayName || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.mutedForeground }]}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map((stat, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
            Quick Actions
          </Text>
          {quickActions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: action.iconBg }]}>
                <Ionicons name={action.icon} size={24} color={action.iconColor} />
              </View>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: theme.foreground }]}>
                  {action.title}
                </Text>
                <Text style={[styles.actionSubtitle, { color: theme.mutedForeground }]}>
                  {action.subtitle}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Banner */}
        <View style={styles.section}>
          <View style={[styles.ctaBanner, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }]}>
            <Text style={[styles.ctaTitle, { color: theme.foreground }]}>
              Ready to Swipe?
            </Text>
            <Text style={[styles.ctaSubtitle, { color: theme.mutedForeground }]}>
              Your dream job is just a swipe away. Start matching now.
            </Text>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: theme.primary }]}
              onPress={() => navigation.navigate('Jobs')}
              activeOpacity={0.85}
            >
              <Text style={[styles.ctaButtonText, { color: theme.primaryForeground }]}>
                Start Matching
              </Text>
              <Ionicons name="arrow-forward" size={16} color={theme.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: theme.destructive }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.destructive} />
            <Text style={[styles.logoutText, { color: theme.destructive }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  profileHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    marginRight: Spacing.lg,
  },
  profileText: { flex: 1 },
  greeting: { fontSize: FontSize.sm },
  userName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: 2 },
  userEmail: { fontSize: FontSize.sm, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statValue: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, marginTop: Spacing.xs },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  actionSubtitle: { fontSize: FontSize.sm, marginTop: 2 },
  ctaBanner: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  ctaTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  ctaSubtitle: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  ctaButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});

export default HomeScreen;
