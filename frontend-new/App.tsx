import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './components/ErrorBoundary';
import ManualScrollControls from './components/ManualScrollControls';
import { AuthProvider } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

const linking = {
  prefixes: ['http://localhost:8092', 'http://127.0.0.1:8092', 'https://swipe-connect-eight.vercel.app'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',
      Main: {
        screens: {
          Home: '',
          Discover: 'discover',
          Network: 'network',
          Profile: 'profile',
        },
      },
      Settings: 'settings',
      Help: 'help',
      JobFilters: 'job-preferences',
      ResumeUpload: 'resume',
      ResumeBuilder: 'resume-builder',
      CoverLetter: 'cover-letter',
      Privacy: 'privacy',
      Chat: 'chat/:matchId?',
      ConnectionProfile: 'connection/:profileId?',
      Notifications: 'notifications',
      Jobs: 'jobs',
    },
  },
};

const ThemedApp = () => {
  const { isDark } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer linking={linking}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AppNavigator />
      </NavigationContainer>
      <ManualScrollControls />
    </View>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <DemoProvider>
            <NetworkProvider>
              <NotificationProvider>
                <PremiumProvider>
                  <UserProfileProvider>
                    <ThemedApp />
                  </UserProfileProvider>
                </PremiumProvider>
              </NotificationProvider>
            </NetworkProvider>
          </DemoProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
