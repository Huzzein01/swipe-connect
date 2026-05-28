import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type ProfileScreenProps = {
  navigation: any;
};

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const { theme } = useTheme();
  const { user, updateUserProfile, signInHistory } = useAuth();
  const { resume } = useDemo();
  const latestSignIn = signInHistory[0];
  const initials = (user?.displayName || user?.email || 'SC')
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const handleEditProfile = async () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      Alert.alert('Edit profile', 'Profile editing is active on the web preview. Native image picking comes next for the store builds.');
      return;
    }

    const displayName = window.prompt('Display name', user?.displayName || '')?.trim();
    if (displayName === undefined) return;
    const photoURL = window.prompt('Profile photo URL', user?.photoURL || '')?.trim();

    await updateUserProfile(displayName || user?.displayName || 'SwipeConnect User', photoURL || undefined);
    Alert.alert('Profile updated', 'Your name and photo were saved to this demo account.');
  };

  const formatSignInTime = (value?: string) => {
    if (!value) return 'No tracked sign-ins yet';
    return new Date(value).toLocaleString();
  };

  const menuSections = [
    {
      title: 'Career',
      items: [
        {
          title: 'Resume',
          subtitle: 'Upload & manage your resume',
          icon: 'document-text-outline' as const,
          iconBg: `${theme.accent}15`,
          iconColor: theme.accent,
          onPress: () => navigation.navigate('ResumeUpload'),
        },
        {
          title: 'Job Preferences',
          subtitle: 'Set your matching criteria',
          icon: 'briefcase-outline' as const,
          iconBg: `${theme.primary}15`,
          iconColor: theme.primary,
          onPress: () => navigation.navigate('JobFilters'),
        },
      ],
    },
    {
      title: 'General',
      items: [
        {
          title: 'Account Settings',
          subtitle: 'Theme, notifications, privacy',
          icon: 'settings-outline' as const,
          iconBg: `${theme.secondary}15`,
          iconColor: theme.secondary,
          onPress: () => navigation.navigate('Settings'),
        },
        {
          title: 'Help & Support',
          subtitle: 'FAQ, contact, feedback',
          icon: 'help-circle-outline' as const,
          iconBg: `${theme.warning}15`,
          iconColor: theme.warning,
          onPress: () => navigation.navigate('Help'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={[styles.avatar, { borderColor: theme.primary }]}
            />
          ) : (
            <View style={[styles.avatarFallback, { borderColor: theme.primary, backgroundColor: `${theme.primary}18` }]}>
              <Text style={[styles.avatarInitials, { color: theme.primary }]}>{initials || 'SC'}</Text>
            </View>
          )}
          <Text style={[styles.userName, { color: theme.foreground }]}>
            {user?.displayName || 'User Name'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.mutedForeground }]}>
            {user?.email}
          </Text>

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: `${theme.primary}15` }]}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={16} color={theme.primary} />
            <Text style={[styles.editButtonText, { color: theme.primary }]}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.profileStats}>
            <View style={[styles.statPill, { backgroundColor: theme.muted }]}>
              <Ionicons name="document-text-outline" size={15} color={resume ? theme.success : theme.mutedForeground} />
              <Text style={[styles.statPillText, { color: theme.foreground }]}>
                {resume ? 'Resume active' : 'Resume needed'}
              </Text>
            </View>
            <View style={[styles.statPill, { backgroundColor: theme.muted }]}>
              <Ionicons name="log-in-outline" size={15} color={theme.primary} />
              <Text style={[styles.statPillText, { color: theme.foreground }]}>
                {signInHistory.length} sign-ins
              </Text>
            </View>
          </View>

          <Text style={[styles.signInText, { color: theme.mutedForeground }]}>
            Last sign-in: {formatSignInTime(latestSignIn?.at)}
          </Text>
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.menuSection}>
            <Text style={[styles.menuSectionTitle, { color: theme.foreground }]}>
              {section.title}
            </Text>
            <View style={[styles.menuCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {section.items.map((item, iIdx) => (
                <React.Fragment key={iIdx}>
                  {iIdx > 0 && <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />}
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon} size={22} color={item.iconColor} />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={[styles.menuItemTitle, { color: theme.foreground }]}>
                        {item.title}
                      </Text>
                      <Text style={[styles.menuItemSubtitle, { color: theme.mutedForeground }]}>
                        {item.subtitle}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  profileCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    marginBottom: Spacing.lg,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  avatarInitials: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.bold,
  },
  userName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.lg,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  editButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  profileStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  statPillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  signInText: {
    marginTop: Spacing.md,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  menuSection: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing['2xl'],
  },
  menuSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  menuCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  menuItemSubtitle: { fontSize: FontSize.sm, marginTop: 2 },
  menuDivider: { height: 1, marginLeft: 76 },
  bottomPadding: { height: Spacing['4xl'] },
});

export default ProfileScreen;
