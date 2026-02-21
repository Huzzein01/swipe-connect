import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import { Resume } from '../types/job';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type ResumeUploadScreenProps = {
  navigation: any;
};

const ResumeUploadScreen = ({ navigation }: ResumeUploadScreenProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        setIsLoading(true);
        const mockParsedResume: Resume = {
          id: '1',
          userId: user?.uid || '',
          fileUrl: pickedFile.uri,
          parsedData: {
            name: 'John Doe',
            email: 'john@example.com',
            location: { city: 'San Francisco', state: 'CA' },
            education: [
              {
                degree: 'Bachelor of Science',
                field: 'Computer Science',
                institution: 'University of California',
                graduationDate: '2020-05',
              },
            ],
            experience: [
              {
                title: 'Software Engineer',
                company: 'Tech Corp',
                location: 'San Francisco, CA',
                startDate: '2020-06',
                endDate: '2023-12',
                description: 'Developed and maintained web applications...',
              },
            ],
            skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          },
          lastUpdated: new Date().toISOString(),
        };
        setResume(mockParsedResume);
        setIsLoading(false);
        Alert.alert('Success', 'Resume parsed successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload resume. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resume) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Resume saved successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save resume.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerSection}>
            <View style={[styles.headerIcon, { backgroundColor: `${theme.accent}15` }]}>
              <Ionicons name="document-text" size={32} color={theme.accent} />
            </View>
            <Text style={[styles.title, { color: theme.foreground }]}>
              Upload Your Resume
            </Text>
            <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>
              Our AI automatically extracts your skills, experience, and preferences for smarter matching.
            </Text>
          </View>

          {/* Upload Area */}
          <TouchableOpacity
            style={[styles.uploadArea, { borderColor: theme.primary, backgroundColor: `${theme.primary}08` }]}
            onPress={pickDocument}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload-outline" size={40} color={theme.primary} />
            <Text style={[styles.uploadTitle, { color: theme.foreground }]}>
              {resume ? 'Change Resume' : 'Select Resume'}
            </Text>
            <Text style={[styles.uploadHint, { color: theme.mutedForeground }]}>
              PDF, DOC, or DOCX
            </Text>
          </TouchableOpacity>

          {/* Loading */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
                {resume ? 'Saving...' : 'Parsing Resume with AI...'}
              </Text>
            </View>
          )}

          {/* Parsed Result */}
          {resume && (
            <View style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.resultTitle, { color: theme.foreground }]}>
                  Parsed Information
                </Text>
              </View>

              {/* Name */}
              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: theme.mutedForeground }]}>Name</Text>
                <Text style={[styles.resultValue, { color: theme.foreground }]}>
                  {resume.parsedData.name}
                </Text>
              </View>

              {/* Location */}
              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: theme.mutedForeground }]}>Location</Text>
                <Text style={[styles.resultValue, { color: theme.foreground }]}>
                  {`${resume.parsedData.location.city}, ${resume.parsedData.location.state}`}
                </Text>
              </View>

              {/* Experience */}
              {resume.parsedData.experience.length > 0 && (
                <View style={styles.resultField}>
                  <Text style={[styles.resultLabel, { color: theme.mutedForeground }]}>
                    Latest Role
                  </Text>
                  <Text style={[styles.resultValue, { color: theme.foreground }]}>
                    {resume.parsedData.experience[0].title} at {resume.parsedData.experience[0].company}
                  </Text>
                </View>
              )}

              {/* Skills */}
              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: theme.mutedForeground }]}>Skills</Text>
                <View style={styles.skillsRow}>
                  {resume.parsedData.skills.map((skill, index) => (
                    <View key={index} style={[styles.skillTag, { backgroundColor: `${theme.primary}15` }]}>
                      <Text style={[styles.skillTagText, { color: theme.primary }]}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                onPress={handleSave}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={[styles.saveButtonText, { color: theme.primaryForeground }]}>
                  Save Resume
                </Text>
                <Ionicons name="checkmark" size={18} color={theme.primaryForeground} />
              </TouchableOpacity>
            </View>
          )}

          {/* Info checklist */}
          {!resume && (
            <View style={styles.checklist}>
              {[
                'Automatic skill extraction',
                'Experience level detection',
                'Preference recommendation engine',
              ].map((item, idx) => (
                <View key={idx} style={styles.checkItem}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                  <Text style={[styles.checkText, { color: theme.mutedForeground }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: Spacing.xl },
  headerSection: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  subtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing['4xl'],
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.sm,
  },
  uploadTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  uploadHint: { fontSize: FontSize.sm },
  loadingContainer: { alignItems: 'center', marginVertical: Spacing['2xl'], gap: Spacing.md },
  loadingText: { fontSize: FontSize.md },
  resultCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  resultTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  resultField: { marginBottom: Spacing.lg },
  resultLabel: { fontSize: FontSize.sm, marginBottom: Spacing.xs },
  resultValue: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  skillTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  saveButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  saveButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  checklist: { gap: Spacing.md, marginTop: Spacing.lg },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  checkText: { fontSize: FontSize.sm },
});

export default ResumeUploadScreen;
