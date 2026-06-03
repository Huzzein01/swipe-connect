import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any };

// ─── ATS-approved resume templates ───────────────────────────────────────────
type Template = {
  id: string;
  name: string;
  style: 'classic' | 'modern' | 'executive' | 'technical' | 'minimal';
  description: string;
  bestFor: string;
  atsScore: number;
  accentColor: string;
};

const TEMPLATES: Template[] = [
  {
    id: 'classic',
    name: 'Classic',
    style: 'classic',
    description: 'Traditional chronological format trusted by recruiters for 20+ years.',
    bestFor: 'All industries',
    atsScore: 99,
    accentColor: '#1D4ED8',
  },
  {
    id: 'modern',
    name: 'Modern',
    style: 'modern',
    description: 'Clean two-column layout that highlights skills alongside experience.',
    bestFor: 'Tech, Design, Product',
    atsScore: 96,
    accentColor: '#7C3AED',
  },
  {
    id: 'executive',
    name: 'Executive',
    style: 'executive',
    description: 'Bold header and strong achievement-first sections for senior roles.',
    bestFor: 'Senior / Leadership',
    atsScore: 97,
    accentColor: '#0F172A',
  },
  {
    id: 'technical',
    name: 'Technical',
    style: 'technical',
    description: 'Skills-first format. Puts your tech stack front and centre.',
    bestFor: 'Engineers, Data, DevOps',
    atsScore: 98,
    accentColor: '#059669',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    style: 'minimal',
    description: 'Ultra-clean single-column. No graphics, maximum ATS parse-rate.',
    bestFor: 'Finance, Legal, Consulting',
    atsScore: 100,
    accentColor: '#64748B',
  },
];

// ─── Realistic resume thumbnail primitives ───────────────────────────────────
const PAPER = '#FFFFFF';
const INK = '#1E293B';      // dark text
const INK_SOFT = '#CBD5E1'; // body line gray

// A short coloured "section heading" bar
const Heading = ({ color, w = 32 }: { color: string; w?: number }) => (
  <View style={{ width: w, height: 4, borderRadius: 2, backgroundColor: color, marginBottom: 3 }} />
);
// A body text line
const Line = ({ w = '100%', mb = 2.5, color = INK_SOFT }: { w?: any; mb?: number; color?: string }) => (
  <View style={{ width: w, height: 2.5, borderRadius: 1.5, backgroundColor: color, marginBottom: mb }} />
);

// ─── Per-style realistic mini resume ─────────────────────────────────────────
const TemplatePreview = ({ template, selected }: { template: Template; selected: boolean }) => {
  const { theme } = useTheme();
  const c = template.accentColor;

  const Body = () => {
    switch (template.style) {
      // Classic — centered header, full divider, left sections
      case 'classic':
        return (
          <View style={styles.paper}>
            <View style={{ alignItems: 'center', marginBottom: 5 }}>
              <View style={{ width: 52, height: 6, borderRadius: 2, backgroundColor: INK, marginBottom: 3 }} />
              <View style={{ width: 70, height: 2.5, borderRadius: 1.5, backgroundColor: INK_SOFT }} />
            </View>
            <View style={{ height: 1, backgroundColor: c, marginBottom: 5 }} />
            <Heading color={c} w={26} />
            <Line w="92%" /><Line w="80%" /><Line w="60%" mb={5} />
            <Heading color={c} w={30} />
            <Line w="88%" /><Line w="70%" />
          </View>
        );
      // Modern — left coloured sidebar + main column
      case 'modern':
        return (
          <View style={[styles.paper, { flexDirection: 'row', padding: 0 }]}>
            <View style={{ width: '34%', backgroundColor: `${c}22`, padding: 6, gap: 4 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c, alignSelf: 'center', marginBottom: 2 }} />
              <Heading color={c} w={20} />
              <Line w="90%" color={`${c}99`} /><Line w="70%" color={`${c}99`} />
              <View style={{ height: 4 }} />
              <Heading color={c} w={20} />
              <Line w="85%" color={`${c}99`} /><Line w="65%" color={`${c}99`} />
            </View>
            <View style={{ flex: 1, padding: 6 }}>
              <View style={{ width: 46, height: 5, borderRadius: 2, backgroundColor: INK, marginBottom: 4 }} />
              <Heading color={c} w={26} />
              <Line w="95%" /><Line w="82%" /><Line w="60%" mb={5} />
              <Heading color={c} w={22} />
              <Line w="90%" /><Line w="72%" />
            </View>
          </View>
        );
      // Executive — full-width dark header band
      case 'executive':
        return (
          <View style={[styles.paper, { padding: 0 }]}>
            <View style={{ backgroundColor: c, padding: 7, marginBottom: 5 }}>
              <View style={{ width: 58, height: 6, borderRadius: 2, backgroundColor: '#fff', marginBottom: 3 }} />
              <View style={{ width: 78, height: 2.5, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.7)' }} />
            </View>
            <View style={{ paddingHorizontal: 7 }}>
              <Heading color={c} w={30} />
              <Line w="94%" /><Line w="78%" mb={5} />
              <Heading color={c} w={24} />
              <Line w="88%" /><Line w="66%" />
            </View>
          </View>
        );
      // Technical — left tech sidebar, mono-feel main
      case 'technical':
        return (
          <View style={[styles.paper, { flexDirection: 'row', padding: 0 }]}>
            <View style={{ width: '30%', backgroundColor: c, padding: 6, gap: 3 }}>
              <View style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.85)', marginBottom: 2 }} />
              <View style={{ width: 24, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.85)' }} />
              <Line w="80%" color="rgba(255,255,255,0.6)" /><Line w="65%" color="rgba(255,255,255,0.6)" />
              <Line w="75%" color="rgba(255,255,255,0.6)" /><Line w="55%" color="rgba(255,255,255,0.6)" />
            </View>
            <View style={{ flex: 1, padding: 6 }}>
              <View style={{ width: 44, height: 5, borderRadius: 2, backgroundColor: INK, marginBottom: 4 }} />
              <Heading color={c} w={28} />
              <Line w="96%" /><Line w="84%" /><Line w="62%" mb={5} />
              <Heading color={c} w={20} />
              <Line w="90%" />
            </View>
          </View>
        );
      // Minimal — airy single column
      default:
        return (
          <View style={[styles.paper, { padding: 9 }]}>
            <View style={{ width: 50, height: 6, borderRadius: 2, backgroundColor: INK, marginBottom: 2 }} />
            <View style={{ width: 64, height: 2.5, borderRadius: 1.5, backgroundColor: INK_SOFT, marginBottom: 8 }} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: c, marginBottom: 3 }} />
            <Line w="90%" /><Line w="74%" mb={8} />
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: c, marginBottom: 3 }} />
            <Line w="84%" /><Line w="66%" />
          </View>
        );
    }
  };

  return (
    <View style={[
      styles.previewCard,
      { borderColor: selected ? c : theme.border },
      selected && { borderWidth: 2 },
    ]}>
      <Body />
      {selected && (
        <View style={[styles.selectedBadge, { backgroundColor: c }]}>
          <Ionicons name="checkmark" size={10} color="#fff" />
        </View>
      )}
    </View>
  );
};

// ─── Section builder ──────────────────────────────────────────────────────────
type ResumeData = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  certifications: string;
};

const Field = ({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean;
}) => {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: theme.border, backgroundColor: theme.background, color: theme.foreground },
          multiline && { minHeight: 90, textAlignVertical: 'top', paddingTop: Spacing.md },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedForeground}
        multiline={multiline}
      />
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const ResumeBuilderScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const { profile } = useUserProfile();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('classic');
  const [step, setStep] = useState<'template' | 'build' | 'preview'>('template');
  const [generating, setGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState('');

  const [data, setData] = useState<ResumeData>({
    name: profile.displayName || '',
    email: profile.email || '',
    phone: profile.phone || '',
    location: profile.location || '',
    linkedin: profile.linkedinUrl || '',
    github: profile.githubUrl || '',
    summary: profile.bio || '',
    skills: profile.skills.join(', ') || '',
    experience: '',
    education: '',
    certifications: '',
  });

  const set = (key: keyof ResumeData) => (v: string) => setData((d) => ({ ...d, [key]: v }));

  const tpl = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

  const handleGeneratePreview = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1800)); // simulated generation
    const preview = `${data.name.toUpperCase()}
${data.email} | ${data.phone} | ${data.location}
${data.linkedin ? 'LinkedIn: ' + data.linkedin : ''}${data.github ? ' | GitHub: ' + data.github : ''}

PROFESSIONAL SUMMARY
${data.summary || '(Add a summary above)'}

SKILLS
${data.skills || '(Add your skills above)'}

EXPERIENCE
${data.experience || '(Add your work experience above)'}

EDUCATION
${data.education || '(Add your education above)'}

${data.certifications ? 'CERTIFICATIONS\n' + data.certifications : ''}
`.trim();
    setGeneratedResume(preview);
    setGenerating(false);
    setStep('preview');
  };

  const selected = TEMPLATES.find((t) => t.id === selectedTemplate)!;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with back */}
      <View style={[styles.header, { borderColor: theme.border }]}>
        <TouchableOpacity onPress={() => step === 'build' ? setStep('template') : step === 'preview' ? setStep('build') : navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Resume Builder</Text>
          <Text style={[styles.headerSub, { color: theme.mutedForeground }]}>
            {step === 'template' ? 'Choose a template' : step === 'build' ? 'Fill in your details' : 'Preview'}
          </Text>
        </View>
        <View style={[styles.premiumTag, { backgroundColor: `${theme.primary}15` }]}>
          <Ionicons name="sparkles" size={12} color={theme.primary} />
          <Text style={[styles.premiumTagText, { color: theme.primary }]}>PREMIUM</Text>
        </View>
      </View>

      {/* Steps indicator */}
      <View style={styles.steps}>
        {['Template', 'Details', 'Preview'].map((s, i) => {
          const stepKeys = ['template', 'build', 'preview'];
          const active = stepKeys.indexOf(step) >= i;
          return (
            <React.Fragment key={s}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: active ? theme.primary : theme.muted }]}>
                  <Text style={[styles.stepNum, { color: active ? '#fff' : theme.mutedForeground }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepLabel, { color: active ? theme.primary : theme.mutedForeground }]}>{s}</Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, { backgroundColor: stepKeys.indexOf(step) > i ? theme.primary : theme.muted }]} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* Step: Template */}
      {step === 'template' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={true}>
          {/* Already have a resume? Go straight to the ATS scanner */}
          <TouchableOpacity
            style={[styles.atsEntry, { backgroundColor: `${theme.primary}10`, borderColor: `${theme.primary}30` }]}
            onPress={() => navigation.navigate('ATSScanner')}
            activeOpacity={0.85}
          >
            <View style={[styles.atsEntryIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="scan-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.atsEntryTitle, { color: theme.foreground }]}>Already have a resume?</Text>
              <Text style={[styles.atsEntrySub, { color: theme.mutedForeground }]}>Attach it and get an instant ATS score + improvement tips — skip building.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.primary} />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: theme.foreground }]}>ATS-Approved Templates</Text>
          <Text style={[styles.sectionSub, { color: theme.mutedForeground }]}>All templates are optimised for applicant tracking systems used by modern companies.</Text>

          <View style={styles.templateGrid}>
            {TEMPLATES.map((t) => (
              <TouchableOpacity key={t.id} style={styles.templateItem} onPress={() => setSelectedTemplate(t.id)} activeOpacity={0.8}>
                <TemplatePreview template={t} selected={selectedTemplate === t.id} />
                <Text style={[styles.templateName, { color: theme.foreground }]}>{t.name}</Text>
                <Text style={[styles.templateBest, { color: theme.mutedForeground }]}>{t.bestFor}</Text>
                <View style={styles.atsRow}>
                  <Ionicons name="shield-checkmark-outline" size={12} color={theme.success} />
                  <Text style={[styles.atsText, { color: theme.success }]}>ATS {t.atsScore}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.selectedInfo, { backgroundColor: `${tpl.accentColor}10`, borderColor: `${tpl.accentColor}30` }]}>
            <Text style={[styles.selectedName, { color: theme.foreground }]}>{tpl.name} template</Text>
            <Text style={[styles.selectedDesc, { color: theme.mutedForeground }]}>{tpl.description}</Text>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.primary }]} onPress={() => setStep('build')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Continue with {tpl.name}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step: Build */}
      {step === 'build' && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
          <Field label="Full name *" value={data.name} onChange={set('name')} placeholder="Jane Smith" />
          <Field label="Email *" value={data.email} onChange={set('email')} placeholder="jane@example.com" />
          <Field label="Phone" value={data.phone} onChange={set('phone')} placeholder="+1 (312) 555-0000" />
          <Field label="Location" value={data.location} onChange={set('location')} placeholder="Chicago, IL" />
          <Field label="LinkedIn URL" value={data.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/in/janesmith" />
          <Field label="GitHub URL" value={data.github} onChange={set('github')} placeholder="https://github.com/janesmith" />
          <Field label="Professional summary" value={data.summary} onChange={set('summary')} placeholder="2–3 sentences about your background and goals…" multiline />
          <Field label="Skills (comma-separated)" value={data.skills} onChange={set('skills')} placeholder="React Native, TypeScript, Product Strategy…" multiline />
          <Field label="Work experience" value={data.experience} onChange={set('experience')} placeholder={'Senior PM at Acme Corp (2021–Present)\n• Led product roadmap for mobile app…'} multiline />
          <Field label="Education" value={data.education} onChange={set('education')} placeholder={'BSc Computer Science, University of Illinois 2020'} multiline />
          <Field label="Certifications (optional)" value={data.certifications} onChange={set('certifications')} placeholder="Google UX Certificate, AWS Solutions Architect…" multiline />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }, generating && { opacity: 0.7 }]}
            onPress={handleGeneratePreview}
            disabled={generating}
            activeOpacity={0.85}
          >
            {generating
              ? <><ActivityIndicator color="#fff" /><Text style={styles.primaryBtnText}>Generating…</Text></>
              : <><Ionicons name="sparkles" size={18} color="#fff" /><Text style={styles.primaryBtnText}>Generate Preview</Text></>
            }
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={true}>
          <View style={[styles.previewBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.previewBanner, { backgroundColor: selected.accentColor }]}>
              <Ionicons name="document-text" size={18} color="#fff" />
              <Text style={styles.previewBannerText}>{selected.name} Template · ATS {selected.atsScore}%</Text>
            </View>
            <Text style={[styles.previewText, { color: theme.foreground }]}>{generatedResume}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => setStep('build')} activeOpacity={0.8}>
              <Ionicons name="pencil-outline" size={16} color={theme.foreground} />
              <Text style={[styles.secondaryBtnText, { color: theme.foreground }]}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1, backgroundColor: theme.primary }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Save Resume</Text>
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
  steps: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 11, fontWeight: FontWeight.bold },
  stepLabel: { fontSize: 10, fontWeight: FontWeight.semibold },
  stepLine: { flex: 1, height: 2, marginHorizontal: Spacing.xs },
  scroll: { flexGrow: 1, padding: Spacing.xl, paddingBottom: 140 },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: Spacing.sm },
  sectionSub: { fontSize: FontSize.sm, lineHeight: 20, marginBottom: Spacing.xl },
  atsEntry: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.xl },
  atsEntryIcon: { width: 44, height: 44, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  atsEntryTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 2 },
  atsEntrySub: { fontSize: FontSize.sm, lineHeight: 18 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  templateItem: { width: '46%' },
  previewCard: { borderRadius: BorderRadius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.sm, height: 150, position: 'relative', backgroundColor: '#FFFFFF' },
  paper: { flex: 1, backgroundColor: '#FFFFFF', padding: 8 },
  previewHeader: { height: 32, padding: Spacing.sm, gap: 4 },
  previewNameLine: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)', width: '60%' },
  previewSubLine: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.8)', width: '40%' },
  previewContent: { padding: Spacing.sm },
  previewLine: { height: 5, borderRadius: 3 },
  selectedBadge: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  templateName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  templateBest: { fontSize: FontSize.xs, marginTop: 2 },
  atsRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  atsText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  selectedInfo: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.xl },
  selectedName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 4 },
  selectedDesc: { fontSize: FontSize.sm, lineHeight: 20 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, minHeight: 44 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: BorderRadius.lg, gap: Spacing.sm, marginBottom: Spacing.xl },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
  previewBox: { borderWidth: 1, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.xl },
  previewBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  previewBannerText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  previewText: { padding: Spacing.lg, fontSize: FontSize.sm, lineHeight: 22, fontFamily: 'monospace' },
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: BorderRadius.lg, borderWidth: 1, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  secondaryBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});

export default ResumeBuilderScreen;
