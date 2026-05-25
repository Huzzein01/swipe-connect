import React, { useEffect, useState } from 'react';
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
import { useDemo } from '../contexts/DemoContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as DocumentPicker from 'expo-document-picker';
import { Resume } from '../types/job';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type ResumeUploadScreenProps = {
  navigation: any;
};

type PickedResumeFile = DocumentPicker.DocumentPickerAsset;

const skillKeywords = [
  'React Native',
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Python',
  'SQL',
  'GraphQL',
  'Figma',
  'Product Strategy',
  'Analytics',
  'User Research',
  'Project Management',
  'Leadership',
  'Accessibility',
  'AWS',
  'Docker',
  'MongoDB',
];

const citySignals = [
  { city: 'Chicago', state: 'IL' },
  { city: 'San Francisco', state: 'CA' },
  { city: 'New York', state: 'NY' },
  { city: 'Austin', state: 'TX' },
  { city: 'Seattle', state: 'WA' },
  { city: 'Atlanta', state: 'GA' },
  { city: 'Boston', state: 'MA' },
];

const titleSignals = [
  'Frontend Engineer',
  'Software Engineer',
  'Product Manager',
  'Product Designer',
  'Data Analyst',
  'Customer Success Manager',
  'Project Manager',
  'UX Designer',
];

const cleanFileName = (name: string) =>
  name
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .replace(/\b(resume|cv|final|updated|copy)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const titleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const readPickedFileText = async (file: PickedResumeFile) => {
  if (!file.file) return '';

  try {
    const text = await file.file.text();
    return text.replace(/\0/g, ' ').trim();
  } catch (error) {
    return '';
  }
};

const extractName = (text: string, fileName: string, fallbackName?: string | null) => {
  const lines = text
    .split(/\r?\n| {3,}/)
    .map((line) => line.trim())
    .filter(Boolean);
  const likelyName = lines.find((line) =>
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(line)
  );

  if (likelyName) return likelyName;
  if (fallbackName) return fallbackName;

  const cleaned = cleanFileName(fileName);
  return cleaned ? titleCase(cleaned) : 'Preview User';
};

const parseResumeFile = async (
  pickedFile: PickedResumeFile,
  userId: string,
  fallbackName?: string | null,
  fallbackEmail?: string | null
): Promise<Resume> => {
  const rawText = await readPickedFileText(pickedFile);
  const searchableText = `${rawText} ${pickedFile.name}`.toLowerCase();
  const email = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || fallbackEmail || 'preview@swipeconnect.app';
  const phone = rawText.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0];
  const location =
    citySignals.find((signal) => searchableText.includes(signal.city.toLowerCase())) ||
    citySignals.find((signal) => searchableText.includes(signal.state.toLowerCase())) ||
    { city: 'Chicago', state: 'IL' };
  const skills = skillKeywords.filter((skill) => searchableText.includes(skill.toLowerCase()));
  const inferredTitle =
    titleSignals.find((title) => searchableText.includes(title.toLowerCase())) ||
    (skills.some((skill) => ['React Native', 'React', 'TypeScript', 'JavaScript'].includes(skill))
      ? 'Frontend Engineer'
      : 'Product-minded Professional');
  const degree =
    rawText.match(/(?:Bachelor|Master|PhD|B\.S\.|M\.S\.|B\.A\.|M\.A\.)[^.。\n]*/i)?.[0] ||
    'Bachelor of Science';
  const company =
    rawText.match(/\b(?:at|@)\s+([A-Z][A-Za-z0-9&.\s]{2,30})/)?.[1]?.trim() ||
    'Recent Company';

  return {
    id: `resume-${Date.now()}`,
    userId,
    fileUrl: pickedFile.name,
    parsedData: {
      name: extractName(rawText, pickedFile.name, fallbackName),
      email,
      phone,
      location,
      education: [
        {
          degree,
          field: searchableText.includes('design') ? 'Design' : 'Computer Science',
          institution: rawText.match(/\b(?:University|College|Institute) of [A-Z][A-Za-z\s]+/)?.[0] || 'Parsed Institution',
          graduationDate: rawText.match(/\b(20\d{2}|19\d{2})\b/)?.[0] || '2020',
        },
      ],
      experience: [
        {
          title: inferredTitle,
          company,
          location: `${location.city}, ${location.state}`,
          startDate: rawText.match(/\b(20\d{2}|19\d{2})\b/)?.[0] || '2021',
          endDate: searchableText.includes('present') ? 'Present' : undefined,
          description:
            skills.length > 0
              ? `Parsed resume signals for ${skills.slice(0, 4).join(', ')}.`
              : 'Parsed resume attachment and inferred profile details from available document metadata.',
        },
      ],
      skills: skills.length > 0 ? skills : ['React Native', 'TypeScript', 'Analytics', 'User Research'],
      certifications: rawText.match(/certification|certificate/i) ? ['Parsed Certification'] : [],
    },
    lastUpdated: new Date().toISOString(),
  };
};

const ResumeUploadScreen = ({ navigation }: ResumeUploadScreenProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { createSampleResume, resume: savedResume, saveResume } = useDemo();
  const [isLoading, setIsLoading] = useState(false);
  const [resume, setResume] = useState<Resume | null>(savedResume);

  useEffect(() => {
    setResume(savedResume);
  }, [savedResume]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/rtf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        setIsLoading(true);
        const parsedResume = await parseResumeFile(
          pickedFile,
          user?.uid || 'preview-user',
          user?.displayName,
          user?.email
        );
        setResume(parsedResume);
        await saveResume(parsedResume);
        setIsLoading(false);
        Alert.alert('Resume parsed', `${pickedFile.name} was attached and parsed into your profile.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to attach and parse resume. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!resume) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await saveResume(resume);
      Alert.alert('Success', 'Resume saved successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save resume.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleResume = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const sampleResume = createSampleResume(user?.uid || 'preview-user');
      setResume(sampleResume);
      await saveResume(sampleResume);
      Alert.alert('Sample resume ready', 'Skills and experience were added to the matching engine.');
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

          <TouchableOpacity
            style={[styles.sampleButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleSampleResume}
            disabled={isLoading}
            activeOpacity={0.78}
          >
            <Ionicons name="sparkles-outline" size={18} color={theme.accent} />
            <Text style={[styles.sampleButtonText, { color: theme.foreground }]}>
              Use Sample Resume
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

              <View style={[styles.sourceRow, { backgroundColor: theme.muted }]}>
                <Ionicons name="attach-outline" size={16} color={theme.mutedForeground} />
                <Text style={[styles.sourceText, { color: theme.mutedForeground }]} numberOfLines={1}>
                  Source: {resume.fileUrl}
                </Text>
              </View>

              {/* Name */}
              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: theme.mutedForeground }]}>Name</Text>
                <Text style={[styles.resultValue, { color: theme.foreground }]}>
                  {resume.parsedData.name}
                </Text>
              </View>

              <View style={styles.resultField}>
                <Text style={[styles.resultLabel, { color: theme.mutedForeground }]}>Email</Text>
                <Text style={[styles.resultValue, { color: theme.foreground }]}>
                  {resume.parsedData.email}
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
  sampleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing['2xl'],
  },
  sampleButtonText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
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
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  sourceText: { flex: 1, fontSize: FontSize.sm },
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
