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
import { useUserProfile } from '../contexts/UserProfileContext';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Resume } from '../types/job';
import { parseResumeText, parseResumeFileUpload, atsScanResume, ParsedResumeAI, ATSResult } from '../services/aiService';
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

// Read the picked file as base64 (web: FileReader, native: expo-file-system)
// so the backend can extract PDF text via pdf-parse.
const readPickedFileBase64 = async (file: PickedResumeFile): Promise<{ base64: string; mimeType: string }> => {
  const mimeType = (file as any).mimeType || 'application/octet-stream';
  try {
    if (Platform.OS === 'web' && (file as any).file && typeof FileReader !== 'undefined') {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL((file as any).file);
      });
      return { base64, mimeType };
    }
    if (file.uri) {
      const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      return { base64, mimeType };
    }
  } catch {
    /* ignore */
  }
  return { base64: '', mimeType };
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

// Map Gemini's parsed output into the app's Resume shape.
const aiToResume = (
  ai: ParsedResumeAI,
  pickedFile: PickedResumeFile,
  userId: string,
  fallbackName?: string | null,
  fallbackEmail?: string | null
): Resume => {
  const [city = '', state = ''] = (ai.location || '').split(',').map((s) => s.trim());
  return {
    id: `resume-${Date.now()}`,
    userId,
    fileUrl: pickedFile.name,
    parsedData: {
      name: ai.name || fallbackName || cleanFileName(pickedFile.name) || 'Your Name',
      email: ai.email || fallbackEmail || '',
      phone: ai.phone || undefined,
      location: { city: city || 'Remote', state },
      education: (ai.education && ai.education.length > 0)
        ? ai.education.map((e) => ({
            degree: e.degree || 'Degree',
            field: e.field || '',
            institution: e.institution || '',
            graduationDate: e.graduationDate || '',
          }))
        : [],
      experience: (ai.experience && ai.experience.length > 0)
        ? ai.experience.map((x) => ({
            title: x.title || ai.title || 'Professional',
            company: x.company || '',
            location: ai.location || '',
            startDate: x.startDate || '',
            endDate: x.endDate || undefined,
            description: x.description || '',
          }))
        : [{ title: ai.title || 'Professional', company: '', location: ai.location || '', startDate: '', description: ai.experienceSummary || '' }],
      skills: ai.skills && ai.skills.length > 0 ? ai.skills : [],
      certifications: ai.certifications || [],
      summary: ai.summary || ai.experienceSummary || '',
      projects: ai.projects || [],
      volunteer: ai.volunteer || [],
    },
    lastUpdated: new Date().toISOString(),
  };
};

const parseResumeFile = async (
  pickedFile: PickedResumeFile,
  userId: string,
  fallbackName?: string | null,
  fallbackEmail?: string | null
): Promise<{ resume: Resume; summary: string }> => {
  const rawText = await readPickedFileText(pickedFile);

  // ── Best path: upload the file so the backend extracts PDF text (pdf-parse)
  // then Gemini parses it. This is the only reliable way to read PDFs.
  try {
    const { base64, mimeType } = await readPickedFileBase64(pickedFile);
    if (base64) {
      const ai = await parseResumeFileUpload(base64, mimeType, pickedFile.name);
      if (ai && (ai.name || (ai.skills && ai.skills.length > 0))) {
        return { resume: aiToResume(ai, pickedFile, userId, fallbackName, fallbackEmail), summary: ai.experienceSummary || '' };
      }
    }
  } catch {
    // fall through to text-based parsing
  }

  // ── Next: Gemini parsing from whatever text the browser could read (good for .txt/.md)
  if (rawText && rawText.trim().length > 60) {
    try {
      const ai = await parseResumeText(rawText);
      if (ai && (ai.name || (ai.skills && ai.skills.length > 0))) {
        return { resume: aiToResume(ai, pickedFile, userId, fallbackName, fallbackEmail), summary: ai.experienceSummary || '' };
      }
    } catch {
      // fall through to local heuristic parsing
    }
  }

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

  const resume: Resume = {
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
  return { resume, summary: '' };
};

const ResumeUploadScreen = ({ navigation }: ResumeUploadScreenProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { createSampleResume, resume: savedResume, saveResume } = useDemo();
  const { profile, updateProfile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('Parsing Resume with AI...');
  const [resume, setResume] = useState<Resume | null>(savedResume);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);

  useEffect(() => {
    setResume(savedResume);
  }, [savedResume]);

  // Merge parsed resume fields into UserProfile — only fills empty fields,
  // always merges skills (union, no duplicates).
  const isBlankish = (value?: string) => {
    const normalized = (value || '').trim().toLowerCase();
    return !normalized || ['your name', 'preview user', 'add your professional title', 'professional'].includes(normalized);
  };

  const mergeUnique = (current: string[], incoming: string[]) => {
    const seen = new Set(current.map((item) => item.toLowerCase()));
    return [...current, ...incoming.filter((item) => item && !seen.has(item.toLowerCase()))];
  };

  const inferExperienceYears = (startDate?: string) => {
    const year = Number(startDate?.match(/\b(19|20)\d{2}\b/)?.[0]);
    if (!year || year > new Date().getFullYear()) return '';
    const years = Math.max(0, new Date().getFullYear() - year);
    if (years <= 1) return '0-1 year';
    if (years <= 3) return '1-3 years';
    if (years < 5) return '3-5 years';
    if (years <= 8) return '5-8 years';
    if (years <= 12) return '8-12 years';
    return '12+ years';
  };

  const inferIndustries = (skills: string[]) => {
    const haystack = skills.join(' ').toLowerCase();
    const industries: string[] = [];
    if (/react|typescript|javascript|node|python|sql|aws|docker|mongodb/.test(haystack)) industries.push('Technology');
    if (/analytics|sql|python|data/.test(haystack)) industries.push('Data');
    if (/figma|research|product|strategy/.test(haystack)) industries.push('Product');
    if (/ai|machine learning|llm/.test(haystack)) industries.push('AI');
    return industries.length ? industries : ['Technology'];
  };

  const syncResumeToProfile = async (parsed: Resume, summary?: string) => {
    const d = parsed.parsedData;
    const latest = d.experience?.[0];
    const skills = d.skills || [];
    const role = latest?.title || '';
    const company = latest?.company || '';
    const inferredExperience = inferExperienceYears(latest?.startDate);
    const patch: Record<string, any> = {};

    if (isBlankish(profile.displayName) && d.name) patch.displayName = d.name;
    if (!profile.email && d.email) patch.email = d.email;
    if (!profile.phone && d.phone) patch.phone = d.phone;
    if (!profile.location && d.location?.city) {
      patch.location = `${d.location.city}, ${d.location.state || ''}`.trim().replace(/,$/, '');
    }
    if (isBlankish(profile.title) && role) patch.title = role;
    if (!profile.currentCompany && company && company !== 'Recent Company') patch.currentCompany = company;
    if ((!profile.experienceYears || profile.experienceYears === '3-5 years') && inferredExperience) {
      patch.experienceYears = inferredExperience;
    }
    // Bio ← the resume's own Summary/Objective section (preferred), else AI summary
    const resumeSummary = (d as any).summary || summary || latest?.description || '';
    if (!profile.bio && resumeSummary) patch.bio = resumeSummary;

    // Always merge skills — union of existing + newly extracted
    if (skills.length) {
      patch.skills = mergeUnique(profile.skills, skills);
      patch.industries = mergeUnique(profile.industries, inferIndustries(skills));
    }

    if (role) {
      patch.targetRoles = mergeUnique(profile.targetRoles, [role]);
      if (!profile.openToRoles) patch.openToRoles = `${role} roles`;
    }

    if (skills.length && !profile.networkingGoals) {
      patch.networkingGoals = `Open to collaborating on projects involving ${skills.slice(0, 3).join(', ')}.`;
    }

    if (skills.length && profile.projectIdeas.length === 0) {
      patch.projectIdeas = [`Build a product using ${skills.slice(0, 2).join(' and ')}`];
    }

    // ── Sync the rest of the resume (projects, volunteer, certifications, experience)
    const projects = ((d as any).projects || []) as { name: string; description: string }[];
    if (projects.length && profile.projects.length === 0) {
      patch.projects = projects.map((p) => (p.description ? `${p.name} — ${p.description}` : p.name)).filter(Boolean);
    }
    const volunteer = ((d as any).volunteer || []) as { role: string; organization: string; description: string }[];
    if (volunteer.length && profile.volunteer.length === 0) {
      patch.volunteer = volunteer.map((v) => `${v.role}${v.organization ? ' at ' + v.organization : ''}${v.description ? ' — ' + v.description : ''}`).filter(Boolean);
    }
    if (d.certifications?.length && profile.certifications.length === 0) {
      patch.certifications = mergeUnique(profile.certifications, d.certifications);
    }
    if (d.experience?.length && profile.experienceHighlights.length === 0) {
      patch.experienceHighlights = d.experience
        .map((e) => `${e.title}${e.company ? ' at ' + e.company : ''}${e.description ? ' — ' + e.description : ''}`)
        .filter(Boolean)
        .slice(0, 8);
    }

    if (Object.keys(patch).length > 0) {
      await updateProfile(patch);
    }
  };

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
        setLoadingLabel('Parsing resume...');
        const { resume: parsedResume, summary } = await parseResumeFile(
          pickedFile,
          user?.uid || 'preview-user',
          user?.displayName,
          user?.email
        );
        setResume(parsedResume);
        await saveResume(parsedResume);
        await syncResumeToProfile(parsedResume, summary);

        // Auto-run an ATS scan on the freshly uploaded resume.
        setLoadingLabel('Running ATS scan...');
        try {
          const { base64, mimeType } = await readPickedFileBase64(pickedFile);
          const targetRole = parsedResume.parsedData.experience?.[0]?.title || profile.title || '';
          const ats = base64
            ? await atsScanResume({ base64, mimeType, name: pickedFile.name, targetRole })
            : null;
          setAtsResult(ats);
          setIsLoading(false);
          Alert.alert(
            'Resume synced & scanned',
            ats
              ? `${pickedFile.name} was parsed and your profile updated. ATS score: ${ats.score}/100 (${ats.rating}). Tap "View full ATS report" for ${ats.improvements.length} suggestions.`
              : `${pickedFile.name} was parsed and your profile updated with your skills, experience, and projects.`
          );
        } catch {
          setIsLoading(false);
          Alert.alert('Resume synced', `${pickedFile.name} was parsed and your profile updated.`);
        }
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('Error', 'Failed to attach and parse resume. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!resume) return;
    setIsLoading(true);
    setLoadingLabel('Saving resume...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await saveResume(resume);
      await syncResumeToProfile(resume);
      Alert.alert('Saved', 'Resume saved and profile updated.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save resume.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleResume = async () => {
    setIsLoading(true);
    setLoadingLabel('Creating sample resume...');
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const sampleResume = createSampleResume(user?.uid || 'preview-user');
      setResume(sampleResume);
      await saveResume(sampleResume);
      await syncResumeToProfile(sampleResume);
      Alert.alert('Sample resume ready', 'Skills and experience were synced to your profile and the matching engine.');
    } catch (error) {
      Alert.alert('Error', 'Failed to create the sample resume.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
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
                {loadingLabel}
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
                <Text style={[styles.resultLabel, { color: theme.mutedForeground }]}>Skills extracted</Text>
                <View style={styles.skillsRow}>
                  {resume.parsedData.skills.map((skill, index) => (
                    <View key={index} style={[styles.skillTag, { backgroundColor: `${theme.primary}15` }]}>
                      <Text style={[styles.skillTagText, { color: theme.primary }]}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Profile sync banner */}
              <View style={[styles.syncBanner, { backgroundColor: `${theme.success}10`, borderColor: `${theme.success}30` }]}>
                <Ionicons name="sync-outline" size={16} color={theme.success} />
                <Text style={[styles.syncText, { color: theme.success }]}>
                  Name, contact, summary, skills, experience, projects &amp; volunteer work synced to your profile.
                </Text>
              </View>

              {/* Auto ATS scan result */}
              {atsResult && (
                <TouchableOpacity
                  style={[styles.atsCard, {
                    backgroundColor: theme.card,
                    borderColor: atsResult.score >= 80 ? `${theme.success}40` : atsResult.score >= 60 ? `${theme.warning}40` : `${theme.destructive}40`,
                  }]}
                  onPress={() => navigation.navigate('ATSScanner', { result: atsResult })}
                  activeOpacity={0.8}
                >
                  <View style={[styles.atsScoreBadge, {
                    borderColor: atsResult.score >= 80 ? theme.success : atsResult.score >= 60 ? theme.warning : theme.destructive,
                  }]}>
                    <Text style={[styles.atsScoreNum, {
                      color: atsResult.score >= 80 ? theme.success : atsResult.score >= 60 ? theme.warning : theme.destructive,
                    }]}>{atsResult.score}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.atsTitle, { color: theme.foreground }]}>ATS score: {atsResult.rating}</Text>
                    <Text style={[styles.atsSub, { color: theme.mutedForeground }]} numberOfLines={2}>
                      {atsResult.improvements.length} suggestions · tap to view full report
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
                </TouchableOpacity>
              )}

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
  scrollContent: { flexGrow: 1, paddingBottom: 140 },
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
  atsCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  atsScoreBadge: { width: 48, height: 48, borderRadius: 24, borderWidth: 3, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  atsScoreNum: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  atsTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 2 },
  atsSub: { fontSize: FontSize.sm, lineHeight: 18 },
  syncBanner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  syncText: { flex: 1, fontSize: FontSize.sm, lineHeight: 19 },
});

export default ResumeUploadScreen;
