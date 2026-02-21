import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

type HomeScreenProps = {
  navigation: any;
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState(user?.displayName || '');

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    // TODO: Implement profile update functionality
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/150' }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editImageButton}>
              <Text style={styles.editImageButtonText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your name"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />
            ) : (
              <Text style={[styles.userName, isDark && styles.textDark]}>{user?.displayName}</Text>
            )}
            <Text style={[styles.userEmail, isDark && styles.textDark]}>{user?.email}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Your Activity</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, isDark && styles.statItemDark]}>
              <Text style={[styles.statNumber, isDark && styles.textDark]}>0</Text>
              <Text style={[styles.statLabel, isDark && styles.textDark]}>Connections</Text>
            </View>
            <View style={[styles.statItem, isDark && styles.statItemDark]}>
              <Text style={[styles.statNumber, isDark && styles.textDark]}>0</Text>
              <Text style={[styles.statLabel, isDark && styles.textDark]}>Messages</Text>
            </View>
            <View style={[styles.statItem, isDark && styles.statItemDark]}>
              <Text style={[styles.statNumber, isDark && styles.textDark]}>0</Text>
              <Text style={[styles.statLabel, isDark && styles.textDark]}>Events</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
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
  profileSection: {
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  editImageButton: {
    padding: 8,
    backgroundColor: '#f4511e',
    borderRadius: 20,
  },
  editImageButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  quickActions: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  statItemDark: {
    backgroundColor: '#2a2a2a',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f4511e',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ff4444',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#fff',
  },
  inputDark: {
    borderColor: '#333',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  textDark: {
    color: '#fff',
  },
});

export default HomeScreen; 