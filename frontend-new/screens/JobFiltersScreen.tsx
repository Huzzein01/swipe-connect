import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  TextInput,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { UserPreferences } from '../types/job';

type JobFiltersScreenProps = {
  navigation: any;
};

const JobFiltersScreen = ({ navigation }: JobFiltersScreenProps) => {
  const { isDark } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    industries: [],
    jobTypes: ['full-time'],
    location: {
      city: '',
      state: '',
      radius: 50,
    },
    remote: true,
    experienceLevel: 'mid',
  });

  const handleSave = () => {
    // TODO: Save preferences
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Location</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="City"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={preferences.location.city}
              onChangeText={(text) =>
                setPreferences({
                  ...preferences,
                  location: { ...preferences.location, city: text },
                })
              }
            />
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="State"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={preferences.location.state}
              onChangeText={(text) =>
                setPreferences({
                  ...preferences,
                  location: { ...preferences.location, state: text },
                })
              }
            />
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="Radius (miles)"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={preferences.location.radius.toString()}
              keyboardType="numeric"
              onChangeText={(text) =>
                setPreferences({
                  ...preferences,
                  location: {
                    ...preferences.location,
                    radius: parseInt(text) || 50,
                  },
                })
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Job Type</Text>
          <View style={styles.optionsContainer}>
            {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  preferences.jobTypes.includes(type as any) && styles.selectedOption,
                  isDark && styles.optionButtonDark,
                ]}
                onPress={() => {
                  const newTypes = preferences.jobTypes.includes(type as any)
                    ? preferences.jobTypes.filter((t) => t !== type)
                    : [...preferences.jobTypes, type as any];
                  setPreferences({ ...preferences, jobTypes: newTypes });
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.jobTypes.includes(type as any) && styles.selectedOptionText,
                    isDark && styles.textDark,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Experience Level</Text>
          <View style={styles.optionsContainer}>
            {['entry', 'mid', 'senior', 'executive'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  preferences.experienceLevel === level && styles.selectedOption,
                  isDark && styles.optionButtonDark,
                ]}
                onPress={() =>
                  setPreferences({ ...preferences, experienceLevel: level as any })
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    preferences.experienceLevel === level && styles.selectedOptionText,
                    isDark && styles.textDark,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && styles.textDark]}>Remote Work</Text>
          <Switch
            value={preferences.remote}
            onValueChange={(value) =>
              setPreferences({ ...preferences, remote: value })
            }
            trackColor={{ false: '#767577', true: '#f4511e' }}
            thumbColor={preferences.remote ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
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
  inputGroup: {
    gap: 10,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDark: {
    borderColor: '#333',
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  optionButtonDark: {
    backgroundColor: '#333',
  },
  selectedOption: {
    backgroundColor: '#f4511e',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedOptionText: {
    color: '#fff',
  },
  saveButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#f4511e',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textDark: {
    color: '#fff',
  },
});

export default JobFiltersScreen; 