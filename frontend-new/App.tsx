import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AppNavigator from './navigation/AppNavigator';

const ThemedApp = () => {
  const { isDark } = useTheme();
  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
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
