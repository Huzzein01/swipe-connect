import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useDemo } from '../contexts/DemoContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

const SettingsScreen = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { logout } = useAuth();
  const { resetDemo } = useDemo();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  useEffect(() => {
    const loadBiometricPreference = async () => {
      const stored = await AsyncStorage.getItem('swipeconnect.biometricAuth');
      setBiometricAuth(stored === 'true');
    };

    loadBiometricPreference();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!enabled) {
      setBiometricAuth(false);
      await AsyncStorage.setItem('swipeconnect.biometricAuth', 'false');
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.prompt('Confirm your account password or device password to enable secure sign-in.');
      if (!confirmed) {
        Alert.alert('Secure sign-in not enabled', 'Password confirmation was cancelled.');
        return;
      }
    } else {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;

      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometric unavailable', 'Set up Face ID, Touch ID, fingerprint, or device passcode first.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SwipeConnect',
        fallbackLabel: 'Use device passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        Alert.alert('Secure sign-in not enabled', 'Biometric authorization was cancelled.');
        return;
      }
    }

    setBiometricAuth(true);
    await AsyncStorage.setItem('swipeconnect.biometricAuth', 'true');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Reset Demo Account',
      'This clears demo jobs, resume, and preferences, then signs out of the preview account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetDemo();
            await logout();
          },
        },
      ]
    );
  };

  const themeOptions: Array<{ label: string; value: 'light' | 'dark' | 'system'; icon: any }> = [
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
    { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Display Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Appearance</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.settingLabel, { color: theme.foreground }]}>Theme</Text>
            <View style={styles.themeOptions}>
              {themeOptions.map((opt) => {
                const isSelected = themeMode === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.themeOption,
                      { backgroundColor: isSelected ? theme.primary : theme.muted },
                    ]}
                    onPress={() => handleThemeChange(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={16}
                      color={isSelected ? theme.primaryForeground : theme.foreground}
                    />
                    <Text style={[
                      styles.themeText,
                      { color: isSelected ? theme.primaryForeground : theme.foreground },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Notifications</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconBox, { backgroundColor: `${theme.primary}15` }]}>
                  <Ionicons name="notifications-outline" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: theme.foreground }]}>
                  Push Notifications
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.muted, true: `${theme.primary}80` }}
                thumbColor={notifications ? theme.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Privacy</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconBox, { backgroundColor: `${theme.accent}15` }]}>
                  <Ionicons name="location-outline" size={20} color={theme.accent} />
                </View>
                <Text style={[styles.settingLabel, { color: theme.foreground }]}>
                  Location Services
                </Text>
              </View>
              <Switch
                value={locationServices}
                onValueChange={setLocationServices}
                trackColor={{ false: theme.muted, true: `${theme.primary}80` }}
                thumbColor={locationServices ? theme.primary : '#f4f3f4'}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingRowLeft}>
                <View style={[styles.settingIconBox, { backgroundColor: `${theme.secondary}15` }]}>
                  <Ionicons name="finger-print-outline" size={20} color={theme.secondary} />
                </View>
                <Text style={[styles.settingLabel, { color: theme.foreground }]}>
                  Biometric Auth
                </Text>
              </View>
              <Switch
                value={biometricAuth}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: theme.muted, true: `${theme.primary}80` }}
                thumbColor={biometricAuth ? theme.primary : '#f4f3f4'}
              />
            </View>
            <Text style={[styles.settingDescription, { color: theme.mutedForeground }]}>
              {biometricAuth
                ? 'Secure sign-in is enabled for this demo account.'
                : Platform.OS === 'web'
                  ? 'Enable to require a password confirmation on this browser.'
                  : 'Enable to verify Face ID or your device biometric prompt before sign-in.'}
            </Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Account</Text>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: theme.destructive }]}
            onPress={handleDeleteAccount}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={theme.destructive} />
            <Text style={[styles.dangerButtonText, { color: theme.destructive }]}>
              Reset Demo Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
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
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  settingDescription: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
    marginLeft: 52,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  themeText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  dangerButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  versionText: {
    textAlign: 'center',
    fontSize: FontSize.sm,
    marginBottom: Spacing['4xl'],
  },
});

export default SettingsScreen;
