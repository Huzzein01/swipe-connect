import React from 'react';
import { Platform, TouchableOpacity, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HelpScreen from '../screens/HelpScreen';
import JobSwipeScreen from '../screens/JobSwipeScreen';
import JobFiltersScreen from '../screens/JobFiltersScreen';
import ResumeUploadScreen from '../screens/ResumeUploadScreen';
import NetworkScreen from '../screens/MatchesScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ResumeBuilderScreen from '../screens/ResumeBuilderScreen';
import CoverLetterScreen from '../screens/CoverLetterScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import NotificationBell from '../components/NotificationBell';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_HEIGHT = Platform.OS === 'ios' ? 88 : 64;
const TAB_PADDING_BOTTOM = Platform.OS === 'ios' ? 28 : 8;

const MainTabs = () => {
  const { theme } = useTheme();
  const { matches } = useNetwork();
  const totalUnread = matches.reduce((sum, m) => sum + m.unreadCount, 0);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Home:     ['home',        'home-outline'],
            Discover: ['compass',     'compass-outline'],
            Network:  ['git-network', 'git-network-outline'],
            Profile:  ['person',      'person-outline'],
          };
          const [filled, outline] = icons[route.name] || ['ellipse', 'ellipse-outline'];
          return (
            <View>
              <Ionicons name={(focused ? filled : outline) as any} size={size} color={color} />
              {route.name === 'Network' && totalUnread > 0 && (
                <View style={{
                  position: 'absolute', top: -4, right: -8,
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: theme.accent,
                }} />
              )}
            </View>
          );
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: TAB_HEIGHT,
          paddingBottom: TAB_PADDING_BOTTOM,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const },
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTintColor: theme.foreground,
        headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Home',
          headerRight: () => (
            <View style={{ marginRight: 16 }}>
              <NotificationBell onPress={() => navigation.navigate('Notifications')} />
            </View>
          ),
        })}
      />
      <Tab.Screen name="Discover" component={JobSwipeScreen} options={{ headerShown: false, title: 'Discover' }} />
      <Tab.Screen name="Network"  component={NetworkScreen}  options={{ headerShown: false, title: 'Network' }} />
      <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // Reusable back button for screens with custom headers
  const BackButton = ({ navigation }: { navigation: any }) => (
    <TouchableOpacity
      onPress={() => navigation.goBack()}
      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={22} color={theme.foreground} />
    </TouchableOpacity>
  );

  const stackScreenOptions = {
    headerStyle: {
      backgroundColor: theme.background,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTintColor: theme.foreground,
    headerTitleStyle: { fontWeight: '700' as const, fontSize: 17 },
    cardStyle: { backgroundColor: theme.background },
    headerLeft: ({ canGoBack, navigation }: any) =>
      canGoBack ? <BackButton navigation={navigation} /> : undefined,
  };

  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      {user ? (
        <>
          <Stack.Screen name="Main"          component={MainTabs}          options={{ headerShown: false }} />
          <Stack.Screen name="Settings"      component={SettingsScreen}    options={{ title: 'Settings' }} />
          <Stack.Screen name="Help"          component={HelpScreen}        options={{ title: 'Help & Support' }} />
          <Stack.Screen name="JobFilters"    component={JobFiltersScreen}  options={{ title: 'Job Preferences' }} />
          <Stack.Screen name="ResumeUpload"  component={ResumeUploadScreen} options={{ title: 'Resume' }} />
          <Stack.Screen name="ResumeBuilder" component={ResumeBuilderScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CoverLetter"   component={CoverLetterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Privacy"       component={PrivacyPolicyScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Chat"          component={ChatScreen}        options={{ title: 'Chat' }} />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={({ navigation }) => ({
              headerShown: true,
              title: 'Notifications',
              headerLeft: () => <BackButton navigation={navigation} />,
            })}
          />
          {/* Legacy route aliases */}
          <Stack.Screen name="Jobs"          component={JobSwipeScreen}    options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"         component={LoginScreen}       options={{ headerShown: false }} />
          <Stack.Screen name="Register"      component={RegisterScreen}    options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
