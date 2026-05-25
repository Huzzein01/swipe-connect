import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type HelpScreenProps = {
  navigation: any;
};

type HelpItem = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  onPress?: () => void;
};

const HelpScreen = ({ navigation }: HelpScreenProps) => {
  const { theme } = useTheme();

  const showHelpTopic = (title: string) => {
    Alert.alert(title, 'This guide is available in preview mode. Full help content can be connected next.');
  };

  const helpSections: Array<{ title: string; items: HelpItem[] }> = [
    {
      title: 'Getting Started',
      items: [
        {
          title: 'How to Use SwipeConnect',
          icon: 'help-circle-outline' as const,
          iconColor: theme.primary,
          iconBg: `${theme.primary}15`,
          onPress: () => showHelpTopic('How to Use SwipeConnect'),
        },
        {
          title: 'Resume Upload Guide',
          icon: 'document-text-outline' as const,
          iconColor: theme.accent,
          iconBg: `${theme.accent}15`,
          onPress: () => showHelpTopic('Resume Upload Guide'),
        },
        {
          title: 'Job Application Process',
          icon: 'briefcase-outline' as const,
          iconColor: theme.secondary,
          iconBg: `${theme.secondary}15`,
          onPress: () => showHelpTopic('Job Application Process'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          title: 'Contact Support',
          icon: 'mail-outline' as const,
          iconColor: theme.primary,
          iconBg: `${theme.primary}15`,
          onPress: () => Linking.openURL('mailto:support@swipeconnect.com'),
        },
        {
          title: 'Privacy Policy',
          icon: 'shield-outline' as const,
          iconColor: theme.accent,
          iconBg: `${theme.accent}15`,
          onPress: () => showHelpTopic('Privacy Policy'),
        },
        {
          title: 'Terms of Service',
          icon: 'document-outline' as const,
          iconColor: theme.secondary,
          iconBg: `${theme.secondary}15`,
          onPress: () => showHelpTopic('Terms of Service'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: `${theme.warning}15` }]}>
            <Ionicons name="help-buoy" size={32} color={theme.warning} />
          </View>
          <Text style={[styles.title, { color: theme.foreground }]}>Help & Support</Text>
          <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
            Find answers to common questions and get support
          </Text>
        </View>

        {helpSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {section.items.map((item, iIdx) => (
                <React.Fragment key={iIdx}>
                  {iIdx > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={item.onPress}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.menuIconBox, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon} size={22} color={item.iconColor} />
                    </View>
                    <Text style={[styles.menuItemText, { color: theme.foreground }]}>
                      {item.title}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.versionText, { color: theme.mutedForeground }]}>
          SwipeConnect v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, textAlign: 'center' },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  sectionCard: {
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
  menuItemText: { flex: 1, fontSize: FontSize.md, fontWeight: FontWeight.medium },
  divider: { height: 1, marginLeft: 76 },
  versionText: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    marginVertical: Spacing['3xl'],
  },
});

export default HelpScreen;
