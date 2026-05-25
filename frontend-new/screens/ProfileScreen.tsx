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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type ProfileScreenProps = {
  navigation: any;
};

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const handleEditProfile = () => {
    Alert.alert(
      'Profile ready',
      'This preview profile is active. Account editing can be connected to Firebase or your backend next.'
    );
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
          <Image
            source={{ uri: user?.photoURL || 'https://via.placeholder.com/100' }}
            style={[styles.avatar, { borderColor: theme.primary }]}
          />
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
