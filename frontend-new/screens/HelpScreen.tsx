import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

type HelpScreenProps = {
  navigation: any;
};

const HelpScreen = ({ navigation }: HelpScreenProps) => {
  const { isDark } = useTheme();

  const helpItems = [
    {
      title: 'How to Use SwipeConnect',
      icon: 'help-circle-outline',
      onPress: () => {
        // TODO: Implement help content
      },
    },
    {
      title: 'Resume Upload Guide',
      icon: 'document-text-outline',
      onPress: () => {
        // TODO: Implement resume guide
      },
    },
    {
      title: 'Job Application Process',
      icon: 'briefcase-outline',
      onPress: () => {
        // TODO: Implement application guide
      },
    },
    {
      title: 'Contact Support',
      icon: 'mail-outline',
      onPress: () => {
        Linking.openURL('mailto:support@swipeconnect.com');
      },
    },
    {
      title: 'Privacy Policy',
      icon: 'shield-outline',
      onPress: () => {
        // TODO: Implement privacy policy
      },
    },
    {
      title: 'Terms of Service',
      icon: 'document-outline',
      onPress: () => {
        // TODO: Implement terms of service
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, isDark && styles.textDark]}>
            Help & Support
          </Text>
          <Text style={[styles.subtitle, isDark && styles.textDark]}>
            Find answers to common questions and get support
          </Text>
        </View>

        <View style={styles.menuContainer}>
          {helpItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, isDark && styles.menuItemDark]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={isDark ? '#fff' : '#666'}
                />
                <Text style={[styles.menuItemText, isDark && styles.textDark]}>
                  {item.title}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDark ? '#666' : '#999'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, isDark && styles.textDark]}>
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemDark: {
    borderBottomColor: '#333',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  textDark: {
    color: '#fff',
  },
});

export default HelpScreen; 