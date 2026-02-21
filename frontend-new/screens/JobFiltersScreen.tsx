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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { UserPreferences } from '../types/job';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type JobFiltersScreenProps = {
  navigation: any;
};

const JobFiltersScreen = ({ navigation }: JobFiltersScreenProps) => {
  const { theme, isDark } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    industries: [],
    jobTypes: ['full-time'],
    location: { city: '', state: '', radius: 50 },
    remote: true,
    experienceLevel: 'mid',
  });

  const handleSave = () => {
    navigation.goBack();
  };

  const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];
  const experienceLevels = ['entry', 'mid', 'senior', 'executive'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Location</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.mutedForeground }]}>City</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                <Ionicons name="location-outline" size={18} color={theme.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.foreground }]}
                  placeholder="e.g. San Francisco"
                  placeholderTextColor={theme.mutedForeground}
                  value={preferences.location.city}
                  onChangeText={(text) =>
                    setPreferences({ ...preferences, location: { ...preferences.location, city: text } })
                  }
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.mutedForeground }]}>State</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                <TextInput
                  style={[styles.input, { color: theme.foreground, paddingLeft: Spacing.md }]}
                  placeholder="e.g. CA"
                  placeholderTextColor={theme.mutedForeground}
                  value={preferences.location.state}
                  onChangeText={(text) =>
                    setPreferences({ ...preferences, location: { ...preferences.location, state: text } })
                  }
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.mutedForeground }]}>Radius (miles)</Text>
              <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                <TextInput
                  style={[styles.input, { color: theme.foreground, paddingLeft: Spacing.md }]}
                  placeholder="50"
                  placeholderTextColor={theme.mutedForeground}
                  value={preferences.location.radius.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) =>
                    setPreferences({
                      ...preferences,
                      location: { ...preferences.location, radius: parseInt(text) || 50 },
                    })
                  }
                />
              </View>
            </View>
          </View>
        </View>

        {/* Job Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Job Type</Text>
          <View style={styles.chipRow}>
            {jobTypes.map((type) => {
              const isSelected = preferences.jobTypes.includes(type as any);
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    { backgroundColor: isSelected ? theme.primary : theme.muted },
                  ]}
                  onPress={() => {
                    const newTypes = isSelected
                      ? preferences.jobTypes.filter((t) => t !== type)
                      : [...preferences.jobTypes, type as any];
                    setPreferences({ ...preferences, jobTypes: newTypes });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    { color: isSelected ? theme.primaryForeground : theme.foreground },
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Experience Level</Text>
          <View style={styles.chipRow}>
            {experienceLevels.map((level) => {
              const isSelected = preferences.experienceLevel === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.chip,
                    { backgroundColor: isSelected ? theme.secondary : theme.muted },
                  ]}
                  onPress={() => setPreferences({ ...preferences, experienceLevel: level as any })}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    { color: isSelected ? '#FFFFFF' : theme.foreground },
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Remote */}
        <View style={styles.section}>
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.switchRow}>
              <View style={styles.switchRowLeft}>
                <View style={[styles.switchIconBox, { backgroundColor: `${theme.accent}15` }]}>
                  <Ionicons name="globe-outline" size={20} color={theme.accent} />
                </View>
                <Text style={[styles.switchLabel, { color: theme.foreground }]}>Remote Work</Text>
              </View>
              <Switch
                value={preferences.remote}
                onValueChange={(value) => setPreferences({ ...preferences, remote: value })}
                trackColor={{ false: theme.muted, true: `${theme.primary}80` }}
                thumbColor={preferences.remote ? theme.primary : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Save */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveButtonText, { color: theme.primaryForeground }]}>
              Save Preferences
            </Text>
            <Ionicons name="checkmark" size={18} color={theme.primaryForeground} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
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
  fieldGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    height: 44,
  },
  inputIcon: { marginLeft: Spacing.md },
  input: { flex: 1, height: '100%', paddingHorizontal: Spacing.md, fontSize: FontSize.md },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  switchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  switchIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  saveButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing['3xl'],
  },
  saveButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});

export default JobFiltersScreen;
