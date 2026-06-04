import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator, Share, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import { downloadCoverLetter } from '../utils/downloadDocument';

type Props = { navigation: any };

const TONES = ['Professional', 'Enthusiastic', 'Concise', 'Storytelling'] as const;
type Tone = typeof TONES[number];

// Module-level so the TextInput keeps focus across keystrokes (defining this
// inside the screen would remount the input on every render → focus loss).
const Field = ({ theme, label, value, onChange, placeholder, multiline }: {
  theme: any; label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) => (
  <View style={{ marginBottom: Spacing.lg }}>
    <Text style={[styles.label, { color: theme.mutedForeground }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        { borderColor: theme.border, backgroundColor: theme.background, color: theme.foreground },
        multiline && { minHeight: 100, textAlignVertical: 'top', paddingTop: Spacing.md },
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={theme.mutedForeground}
      multiline={multiline}
    />
  </View>
);

const CoverLetterScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const { profile } = useUserProfile();

  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [tone, setTone] = useState<Tone>('Professional');
  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState('');
  const [step, setStep] = useState<'form' | 'result'>('form');

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !company.trim()) return;
    setGenerating(true);

    try {
      const API_BASE =
        process.env.EXPO_PUBLIC_API_URL ||
        (Platform.OS === 'android' ? 'http://10.0.2.2:3001/api' : 'http://127.0.0.1:3001/api');

      const res = await fetch(`${API_BASE}/ai/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          company,
          jobDescription: jobDesc,
          tone,
          candidateName: profile.displayName || 'Candidate',
          candidateTitle: profile.title || '',
          candidateSkills: profile.skills,
          candidateBio: profile.bio || '',
          // Pack experience years + real experience highlights + projects so the
          // letter can cite concrete work, not just a years figure.
          candidateExperience: [
            profile.experienceYears,
            profile.experienceHighlights?.length ? 'Experience: ' + profile.experienceHighlights.slice(0, 5).join('; ') : '',
            profile.projects?.length ? 'Projects: ' + profile.projects.slice(0, 4).join('; ') : '',
            profile.volunteer?.length ? 'Volunteer: ' + profile.volunteer.slice(0, 3).join('; ') : '',
          ].filter(Boolean).join('. '),
          contact: {
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            linkedin: profile.linkedinUrl || '',
          },
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setLetter(data.letter || fallbackLetter());
    } catch {
      setLetter(fallbackLetter());
    }

    setGenerating(false);
    setStep('result');
  };

  const fallbackLetter = () => {
    const name = profile.displayName || 'I';
    const title = profile.title || 'professional';
    const skills = profile.skills.slice(0, 3).join(', ') || 'relevant skills';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `${today}

Hiring Manager
${company}

Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${company}. As an experienced ${title} with expertise in ${skills}, I am confident I can bring significant value to your team.

${profile.bio ? profile.bio + '\n\n' : ''}My background aligns well with what you are looking for in this role. I am particularly drawn to ${company}'s mission and believe my experience positions me as an excellent candidate for this opportunity.

I would welcome the opportunity to discuss how my background and skills can contribute to ${company}'s continued success. Thank you for considering my application.

Sincerely,
${profile.displayName || name}
${profile.email || ''}
${profile.phone || ''}
${profile.linkedinUrl || ''}`.trim();
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: letter, title: `Cover Letter – ${jobTitle} at ${company}` });
    } catch { /* ignore */ }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => step === 'result' ? setStep('form') : navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={theme.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Cover Letter</Text>
          <Text style={[styles.headerSub, { color: theme.mutedForeground }]}>AI-powered, tailored to each role</Text>
        </View>
        <View style={[styles.premiumTag, { backgroundColor: `${theme.primary}15` }]}>
          <Ionicons name="sparkles" size={12} color={theme.primary} />
          <Text style={[styles.premiumTagText, { color: theme.primary }]}>PREMIUM</Text>
        </View>
      </View>

      {step === 'form' ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.infoBanner, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}25` }]}>
            <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.foreground }]}>
              AI generates a personalised cover letter using your profile + the job details below.
            </Text>
          </View>

          <Field theme={theme} label="Job title *" value={jobTitle} onChange={setJobTitle} placeholder="Senior Product Manager" />
          <Field theme={theme} label="Company *" value={company} onChange={setCompany} placeholder="Acme Corp" />
          <Field theme={theme} label="Job description (optional but recommended)" value={jobDesc} onChange={setJobDesc} placeholder="Paste the job description here for a more tailored letter…" multiline />

          {/* Tone selector */}
          <Text style={[styles.label, { color: theme.mutedForeground, marginBottom: Spacing.sm }]}>Tone</Text>
          <View style={styles.toneRow}>
            {TONES.map((t) => {
              const active = tone === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.toneChip, { backgroundColor: active ? theme.primary : theme.muted }]}
                  onPress={() => setTone(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toneText, { color: active ? '#fff' : theme.foreground }]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Profile preview */}
          <View style={[styles.profilePreview, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.previewTitle, { color: theme.foreground }]}>Using your profile</Text>
            <Text style={[styles.previewLine, { color: theme.mutedForeground }]}>Name: {profile.displayName || '(not set)'}</Text>
            <Text style={[styles.previewLine, { color: theme.mutedForeground }]}>Title: {profile.title || '(not set)'}</Text>
            <Text style={[styles.previewLine, { color: theme.mutedForeground }]}>
              Skills: {profile.skills.slice(0, 4).join(', ') || '(not set)'}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.editProfileLink}>
              <Text style={[styles.editProfileText, { color: theme.primary }]}>Edit profile →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: theme.primary }, (generating || !jobTitle.trim() || !company.trim()) && { opacity: 0.6 }]}
            onPress={handleGenerate}
            disabled={generating || !jobTitle.trim() || !company.trim()}
            activeOpacity={0.85}
          >
            {generating
              ? <><ActivityIndicator color="#fff" /><Text style={styles.generateBtnText}>Generating…</Text></>
              : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.generateBtnText}>Generate Cover Letter</Text></>
            }
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Result info */}
          <View style={[styles.resultMeta, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}25` }]}>
            <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.resultMetaTitle, { color: theme.foreground }]}>{jobTitle} at {company}</Text>
              <Text style={[styles.resultMetaSub, { color: theme.mutedForeground }]}>Tone: {tone}</Text>
            </View>
            <TouchableOpacity onPress={() => setStep('form')}>
              <Text style={[{ color: theme.primary, fontSize: FontSize.sm, fontWeight: FontWeight.bold }]}>Regenerate</Text>
            </TouchableOpacity>
          </View>

          {/* Letter */}
          <View style={[styles.letterBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.letterText, { color: theme.foreground }]}>{letter}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.shareBtn, { borderColor: theme.border }]} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-outline" size={18} color={theme.foreground} />
              <Text style={[{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: theme.foreground }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareBtn, { borderColor: theme.accent }]}
              onPress={() => downloadCoverLetter(letter, jobTitle, company)}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={18} color={theme.accent} />
              <Text style={[{ fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: theme.accent }]}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.copyBtn, { backgroundColor: theme.primary }]} onPress={handleShare} activeOpacity={0.85}>
              <Ionicons name="copy-outline" size={18} color="#fff" />
              <Text style={[{ color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold }]}>Copy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  headerSub: { fontSize: FontSize.xs, marginTop: 2 },
  premiumTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  premiumTagText: { fontSize: 10, fontWeight: FontWeight.extrabold },
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingBottom: 140 },
  infoBanner: { flexDirection: 'row', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.xl, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, minHeight: 44 },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  toneChip: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  toneText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  profilePreview: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.xl },
  previewTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  previewLine: { fontSize: FontSize.sm, marginBottom: 3 },
  editProfileLink: { marginTop: Spacing.sm },
  editProfileText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: BorderRadius.lg, gap: Spacing.sm },
  generateBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  resultMetaTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  resultMetaSub: { fontSize: FontSize.sm },
  letterBox: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.xl, marginBottom: Spacing.xl },
  letterText: { fontSize: FontSize.sm, lineHeight: 22 },
  actionRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing['3xl'] },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: BorderRadius.lg, borderWidth: 1, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  copyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: BorderRadius.lg, gap: Spacing.sm },
});

export default CoverLetterScreen;
