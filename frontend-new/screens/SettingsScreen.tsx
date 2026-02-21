import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = () => {
  const { themeMode, isDark, setThemeMode } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeMode(newTheme);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Display</Text>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, isDark && styles.textDark]}>Theme</Text>
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'light' && styles.selectedTheme,
                  isDark && styles.themeOptionDark,
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Text style={[styles.themeText, isDark && styles.textDark]}>Light</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'dark' && styles.selectedTheme,
                  isDark && styles.themeOptionDark,
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Text style={[styles.themeText, isDark && styles.textDark]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'system' && styles.selectedTheme,
                  isDark && styles.themeOptionDark,
                ]}
                onPress={() => handleThemeChange('system')}
              >
                <Text style={[styles.themeText, isDark && styles.textDark]}>System</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Notifications</Text>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, isDark && styles.textDark]}>Push Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: '#f4511e' }}
              thumbColor={notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Privacy</Text>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, isDark && styles.textDark]}>Location Services</Text>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{ false: '#767577', true: '#f4511e' }}
              thumbColor={locationServices ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={styles.settingItem}>
            <Text style={[styles.settingLabel, isDark && styles.textDark]}>Biometric Authentication</Text>
            <Switch
              value={biometricAuth}
              onValueChange={setBiometricAuth}
              trackColor={{ false: '#767577', true: '#f4511e' }}
              thumbColor={biometricAuth ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Account</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.versionText, isDark && styles.textDark]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  themeOptionDark: {
    backgroundColor: '#333',
  },
  selectedTheme: {
    backgroundColor: '#f4511e',
  },
  themeText: {
    fontSize: 14,
  },
  dangerButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  textDark: {
    color: '#fff',
  },
});

export default SettingsScreen; 