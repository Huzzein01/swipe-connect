import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDemo } from '../contexts/DemoContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { UserPreferences } from '../types/job';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import MapLocationPicker from '../components/MapLocationPicker';

type JobFiltersScreenProps = {
  navigation: any;
};

const ALL_JOB_TYPES: UserPreferences['jobTypes'] = ['full-time', 'part-time', 'contract', 'internship'];
const EXPERIENCE_LEVELS: UserPreferences['experienceLevel'][] = ['all', 'entry', 'mid', 'senior', 'executive'];

const JobFiltersScreen = ({ navigation }: JobFiltersScreenProps) => {
  const { theme, isDark } = useTheme();
  const { preferences: savedPreferences, savePreferences } = useDemo();
  const { updateProfile } = useUserProfile();
  const [preferences, setPreferences] = useState<UserPreferences>(savedPreferences);

  useEffect(() => {
    setPreferences(savedPreferences);
  }, [savedPreferences]);

  const handleSave = async () => {
    await savePreferences(preferences);
    // Sync the chosen location into the user profile (where they want jobs)
    if (preferences.location.city) {
      await updateProfile({
        location: `${preferences.location.city}${preferences.location.state ? ', ' + preferences.location.state : ''}`,
      });
    }
    Alert.alert('Preferences saved', 'Your swipe deck will rebuild around these filters.');
    navigation.goBack();
  };

  const jobTypes = ALL_JOB_TYPES;
  const experienceLevels = EXPERIENCE_LEVELS;
  const allJobTypesSelected = preferences.jobTypes.length === ALL_JOB_TYPES.length;

  const toggleAllJobTypes = () => {
    setPreferences({
      ...preferences,
      jobTypes: allJobTypesSelected ? ['full-time'] : [...ALL_JOB_TYPES],
    });
  };

  const setRadius = (radius: number) => {
    setPreferences({
      ...preferences,
      location: {
        ...preferences.location,
        radius: Math.max(1, Math.min(500, radius)),
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Location</Text>
          <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.locationRow}>
              <View style={[styles.fieldGroup, { flex: 2 }]}>
                <Text style={[styles.label, { color: theme.mutedForeground }]}>City</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                  <Ionicons name="location-outline" size={18} color={theme.mutedForeground} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.foreground }]}
                    placeholder="e.g. Chicago"
                    placeholderTextColor={theme.mutedForeground}
                    value={preferences.location.city}
                    onChangeText={(text) =>
                      setPreferences({ ...preferences, location: { ...preferences.location, city: text } })
                    }
                  />
                </View>
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: theme.mutedForeground }]}>State</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                  <TextInput
                    style={[styles.input, { color: theme.foreground, paddingLeft: Spacing.md }]}
                    placeholder="IL"
                    placeholderTextColor={theme.mutedForeground}
                    value={preferences.location.state}
                    onChangeText={(text) =>
                      setPreferences({ ...preferences, location: { ...preferences.location, state: text } })
                    }
                  />
                </View>
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.mutedForeground }]}>Radius (miles)</Text>
              <View style={[styles.radiusControl, { borderColor: theme.border, backgroundColor: isDark ? theme.card : '#FFFFFF' }]}>
                <TouchableOpacity
                  style={[styles.radiusButton, { backgroundColor: theme.muted }]}
                  onPress={() => setRadius(preferences.location.radius - 1)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="remove" size={18} color={theme.foreground} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.radiusInput, { color: theme.foreground }]}
                  placeholder="50"
                  placeholderTextColor={theme.mutedForeground}
                  value={preferences.location.radius.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) =>
                    setRadius(parseInt(text, 10) || 1)
                  }
                />
                <Text style={[styles.radiusSuffix, { color: theme.mutedForeground }]}>mi</Text>
                <TouchableOpacity
                  style={[styles.radiusButton, { backgroundColor: theme.muted }]}
                  onPress={() => setRadius(preferences.location.radius + 1)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="add" size={18} color={theme.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Live map */}
          <View style={{ marginTop: Spacing.md }}>
            <MapLocationPicker
              city={preferences.location.city}
              state={preferences.location.state}
              height={260}
              onLocationSelect={(city, state) =>
                setPreferences({ ...preferences, location: { ...preferences.location, city, state } })
              }
            />
          </View>
        </View>

        {/* Job Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>Job Type</Text>
          <View style={styles.chipRow}>
            {/* All chip */}
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: allJobTypesSelected ? theme.primary : theme.muted }]}
              onPress={toggleAllJobTypes}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: allJobTypesSelected ? theme.primaryForeground : theme.foreground }]}>
                All
              </Text>
            </TouchableOpacity>
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
                    // Never allow an empty selection — fall back to full-time
                    setPreferences({ ...preferences, jobTypes: newTypes.length > 0 ? newTypes : ['full-time'] });
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
              const label = level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1);
              return (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.chip,
                    { backgroundColor: isSelected ? theme.secondary : theme.muted },
                  ]}
                  onPress={() => setPreferences({ ...preferences, experienceLevel: level })}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    { color: isSelected ? '#FFFFFF' : theme.foreground },
                  ]}>
                    {label}
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
  scrollContent: { flexGrow: 1, paddingTop: Spacing.sm, paddingBottom: 140 },
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
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  fieldGroup: { minWidth: 120, marginBottom: Spacing.md },
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
  radiusControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  radiusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusInput: {
    flex: 1,
    height: 44,
    minWidth: 72,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  radiusSuffix: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
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
