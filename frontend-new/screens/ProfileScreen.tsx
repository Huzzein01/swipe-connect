import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { useUserProfile, UserProfile, WorkStyle, OpenTo } from '../contexts/UserProfileContext';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

type Props = { navigation: any };

// ─── Editable tag-list ────────────────────────────────────────────────────────
const TagEditor = ({
  label, tags, onUpdate, placeholder, color,
}: { label: string; tags: string[]; onUpdate: (t: string[]) => void; placeholder?: string; color?: string }) => {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const c = color || theme.primary;

  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onUpdate([...tags, v]);
    setInput('');
  };

  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <View style={styles.tagRow}>
        {tags.map((t) => (
          <TouchableOpacity key={t} style={[styles.tag, { backgroundColor: `${c}15` }]} onPress={() => onUpdate(tags.filter((x) => x !== t))}>
            <Text style={[styles.tagText, { color: c }]}>{t}</Text>
            <Ionicons name="close" size={11} color={c} />
          </TouchableOpacity>
        ))}
      </View>
      <View style={[styles.tagInput, { borderColor: theme.border, backgroundColor: theme.background }]}>
        <TextInput
          style={[styles.tagInputText, { color: theme.foreground }]}
          value={input}
          onChangeText={setInput}
          placeholder={placeholder || 'Type and press Add…'}
          placeholderTextColor={theme.mutedForeground}
          onSubmitEditing={add}
          returnKeyType="done"
        />
        <TouchableOpacity onPress={add} style={[styles.tagAddBtn, { backgroundColor: c }]}>
          <Text style={styles.tagAddText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Multi-select chips ───────────────────────────────────────────────────────
const ChipSelect = <T extends string>({
  label, options, selected, onToggle, color,
}: { label: string; options: T[]; selected: T[]; onToggle: (v: T) => void; color?: string }) => {
  const { theme } = useTheme();
  const c = color || theme.primary;
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <View style={styles.tagRow}>
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <TouchableOpacity key={o} style={[styles.chip, { backgroundColor: active ? c : theme.muted }]} onPress={() => onToggle(o)}>
              <Text style={[styles.chipText, { color: active ? '#fff' : theme.foreground }]}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── Section card ─────────────────────────────────────────────────────────────
const Section = ({ title, icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.sectionHead}>
        <View style={[styles.sectionIconBox, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
};

// ─── Text field row ───────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, placeholder, multiline, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: any;
}) => {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[
          styles.textField,
          { borderColor: theme.border, backgroundColor: theme.background, color: theme.foreground },
          multiline && { minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.md },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedForeground}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const ProfileScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const { resume } = useDemo();
  const { profile, updateProfile, profileCompletion } = useUserProfile();
  const [editModal, setEditModal] = useState<'identity' | 'professional' | 'jobSearch' | 'networking' | null>(null);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});
  const fileInputRef = useRef<any>(null);

  // ── Photo picker ────────────────────────────────────────────────────────────
  const handlePhotoPick = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Create a hidden file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const uri = ev.target?.result as string;
          updateProfile({ photoUri: uri });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      Alert.alert(
        'Profile Photo',
        'Choose an option',
        [
          {
            text: 'Enter photo URL',
            onPress: () => {
              Alert.prompt?.('Photo URL', 'Paste a direct image URL', (url) => {
                if (url?.trim()) updateProfile({ photoUri: url.trim() });
              });
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const openEdit = (section: typeof editModal) => {
    setDraft({ ...profile });
    setEditModal(section);
  };

  const saveEdit = async () => {
    await updateProfile(draft);
    setEditModal(null);
  };

  const setD = (patch: Partial<UserProfile>) => setDraft((prev) => ({ ...prev, ...patch }));
  const toggleArray = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const initials = (profile.displayName || user?.displayName || user?.email || 'SC')
    .split(/[ @._-]/).filter(Boolean).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('');

  const photoUri = profile.photoUri || user?.photoURL || '';

  // ─── Edit Modals ─────────────────────────────────────────────────────────
  const renderEditModal = () => {
    if (!editModal) return null;

    const titles: Record<string, string> = {
      identity: 'Edit Profile',
      professional: 'Professional Details',
      jobSearch: 'Job Search Preferences',
      networking: 'Networking & Collaboration',
    };

    return (
      <Modal visible animationType="slide" transparent onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHead}>
              <Text style={[styles.modalTitle, { color: theme.foreground }]}>{titles[editModal]}</Text>
              <TouchableOpacity onPress={() => setEditModal(null)} style={[styles.closeBtn, { backgroundColor: theme.muted }]}>
                <Ionicons name="close" size={18} color={theme.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
              {editModal === 'identity' && (
                <>
                  <Field label="Full name" value={draft.displayName || ''} onChange={(v) => setD({ displayName: v })} placeholder="Your full name" />
                  <Field label="Professional title" value={draft.title || ''} onChange={(v) => setD({ title: v })} placeholder="e.g. Senior Product Manager" />
                  <Field label="Location" value={draft.location || ''} onChange={(v) => setD({ location: v })} placeholder="e.g. Chicago, IL" />
                  <Field label="Phone" value={draft.phone || ''} onChange={(v) => setD({ phone: v })} placeholder="+1 (312) 555-0000" keyboardType="phone-pad" />
                  <Field label="Bio / About me" value={draft.bio || ''} onChange={(v) => setD({ bio: v })} placeholder="Brief professional background and what you're about…" multiline />
                </>
              )}

              {editModal === 'professional' && (
                <>
                  <Field label="Current company" value={draft.currentCompany || ''} onChange={(v) => setD({ currentCompany: v })} placeholder="e.g. Acme Corp" />
                  <View style={{ marginBottom: Spacing.lg }}>
                    <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Years of experience</Text>
                    <View style={styles.tagRow}>
                      {['0-1 year', '1-3 years', '3-5 years', '5-8 years', '8-12 years', '12+ years'].map((opt) => {
                        const active = (draft.experienceYears || '') === opt;
                        return (
                          <TouchableOpacity key={opt} style={[styles.chip, { backgroundColor: active ? theme.primary : theme.muted }]} onPress={() => setD({ experienceYears: opt })}>
                            <Text style={[styles.chipText, { color: active ? '#fff' : theme.foreground }]}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <Field label="LinkedIn URL" value={draft.linkedinUrl || ''} onChange={(v) => setD({ linkedinUrl: v })} placeholder="https://linkedin.com/in/yourhandle" />
                  <Field label="GitHub URL" value={draft.githubUrl || ''} onChange={(v) => setD({ githubUrl: v })} placeholder="https://github.com/yourhandle" />
                  <Field label="Portfolio / website" value={draft.portfolioUrl || ''} onChange={(v) => setD({ portfolioUrl: v })} placeholder="https://yoursite.com" />
                  <TagEditor label="Skills" tags={draft.skills || []} onUpdate={(v) => setD({ skills: v })} placeholder="React Native, Product Strategy…" color={theme.secondary} />
                  <TagEditor label="Industries" tags={draft.industries || []} onUpdate={(v) => setD({ industries: v })} placeholder="Fintech, AI, SaaS…" color={theme.accent} />
                </>
              )}

              {editModal === 'jobSearch' && (
                <>
                  <TagEditor label="Target roles" tags={draft.targetRoles || []} onUpdate={(v) => setD({ targetRoles: v })} placeholder="Product Manager, Growth Lead…" color={theme.primary} />
                  <ChipSelect<WorkStyle>
                    label="Work style preference"
                    options={['Remote', 'Hybrid', 'On-site', 'Flexible']}
                    selected={(draft.workStyle || []) as WorkStyle[]}
                    onToggle={(v) => setD({ workStyle: toggleArray(draft.workStyle || [], v) })}
                    color={theme.primary}
                  />
                  <View style={styles.salaryRow}>
                    <View style={{ flex: 1 }}>
                      <Field label="Salary min ($)" value={draft.salaryMin || ''} onChange={(v) => setD({ salaryMin: v })} placeholder="100,000" keyboardType="numeric" />
                    </View>
                    <View style={[styles.salarySep, { backgroundColor: theme.border }]} />
                    <View style={{ flex: 1 }}>
                      <Field label="Salary max ($)" value={draft.salaryMax || ''} onChange={(v) => setD({ salaryMax: v })} placeholder="150,000" keyboardType="numeric" />
                    </View>
                  </View>
                  <Field label="Open to (free text)" value={draft.openToRoles || ''} onChange={(v) => setD({ openToRoles: v })} placeholder="PM roles, Growth leads at Series A-C startups…" multiline />
                </>
              )}

              {editModal === 'networking' && (
                <>
                  <Field label="What are you building / looking for?" value={draft.networkingGoals || ''} onChange={(v) => setD({ networkingGoals: v })} placeholder="Looking for a technical co-founder for my AI ops startup…" multiline />
                  <TagEditor label="Project ideas" tags={draft.projectIdeas || []} onUpdate={(v) => setD({ projectIdeas: v })} placeholder="AI scheduling tool, SMB automation…" color={theme.accent} />
                  <TagEditor label="Startup interests" tags={draft.startupInterests || []} onUpdate={(v) => setD({ startupInterests: v })} placeholder="Vertical AI, Developer tools…" color={theme.accent} />
                  <ChipSelect<OpenTo>
                    label="Open to"
                    options={['Mentoring', 'Co-founding', 'Freelance', 'Advisory', 'Side project', 'Full-time roles', 'Networking']}
                    selected={(draft.openTo || []) as OpenTo[]}
                    onToggle={(v) => setD({ openTo: toggleArray(draft.openTo || [], v) })}
                    color={theme.accent}
                  />
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderColor: theme.border }]}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border }]} onPress={() => setEditModal(null)}>
                <Text style={[styles.cancelBtnText, { color: theme.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.primary }]} onPress={saveEdit}>
                <Text style={styles.saveBtnText}>Save changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ─── Completion bar ────────────────────────────────────────────────────────
  const completionColor = profileCompletion >= 80 ? theme.success : profileCompletion >= 50 ? theme.warning : theme.primary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Hero card ───────────────────────────────────────────────────── */}
        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Photo */}
          <TouchableOpacity style={styles.avatarWrap} onPress={handlePhotoPick} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={[styles.avatar, { borderColor: theme.primary }]} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: `${theme.primary}18`, borderColor: theme.primary }]}>
                <Text style={[styles.avatarInitials, { color: theme.primary }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Name & title */}
          <Text style={[styles.heroName, { color: theme.foreground }]}>
            {profile.displayName || user?.displayName || 'Your Name'}
          </Text>
          <Text style={[styles.heroTitle, { color: theme.primary }]}>
            {profile.title || 'Add your professional title'}
          </Text>
          <Text style={[styles.heroLocation, { color: theme.mutedForeground }]}>
            {[profile.location, profile.currentCompany].filter(Boolean).join(' · ') || 'Add location & company'}
          </Text>

          {/* Bio */}
          {profile.bio ? (
            <Text style={[styles.heroBio, { color: theme.mutedForeground }]} numberOfLines={3}>{profile.bio}</Text>
          ) : (
            <Text style={[styles.heroBio, { color: theme.mutedForeground, fontStyle: 'italic' }]}>Add a bio to stand out on networking cards</Text>
          )}

          {/* Social links */}
          <View style={styles.socialRow}>
            {profile.linkedinUrl ? (
              <View style={[styles.socialTag, { backgroundColor: '#0A66C215' }]}>
                <Ionicons name="logo-linkedin" size={14} color="#0A66C2" />
                <Text style={[styles.socialTagText, { color: '#0A66C2' }]}>LinkedIn</Text>
              </View>
            ) : null}
            {profile.githubUrl ? (
              <View style={[styles.socialTag, { backgroundColor: `${theme.foreground}15` }]}>
                <Ionicons name="logo-github" size={14} color={theme.foreground} />
                <Text style={[styles.socialTagText, { color: theme.foreground }]}>GitHub</Text>
              </View>
            ) : null}
            {profile.portfolioUrl ? (
              <View style={[styles.socialTag, { backgroundColor: `${theme.accent}15` }]}>
                <Ionicons name="globe-outline" size={14} color={theme.accent} />
                <Text style={[styles.socialTagText, { color: theme.accent }]}>Portfolio</Text>
              </View>
            ) : null}
          </View>

          {/* Completion bar */}
          <View style={styles.completionWrap}>
            <View style={styles.completionHeader}>
              <Text style={[styles.completionLabel, { color: theme.mutedForeground }]}>Profile completion</Text>
              <Text style={[styles.completionPct, { color: completionColor }]}>{profileCompletion}%</Text>
            </View>
            <View style={[styles.completionBar, { backgroundColor: theme.muted }]}>
              <View style={[styles.completionFill, { width: `${profileCompletion}%` as any, backgroundColor: completionColor }]} />
            </View>
          </View>

          {/* Edit identity button */}
          <TouchableOpacity style={[styles.editHeroBtn, { borderColor: theme.border }]} onPress={() => openEdit('identity')} activeOpacity={0.75}>
            <Ionicons name="pencil-outline" size={15} color={theme.primary} />
            <Text style={[styles.editHeroBtnText, { color: theme.primary }]}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Skills & industries ─────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Section title="Professional" icon="briefcase-outline" color={theme.secondary}>
            <View style={{ marginBottom: Spacing.sm }}>
              <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Experience</Text>
              <Text style={[styles.fieldValue, { color: theme.foreground }]}>{profile.experienceYears || '—'}</Text>
            </View>
            {profile.skills.length > 0 && (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Skills</Text>
                <View style={styles.tagRow}>
                  {profile.skills.slice(0, 8).map((s) => (
                    <View key={s} style={[styles.tag, { backgroundColor: `${theme.secondary}14` }]}>
                      <Text style={[styles.tagText, { color: theme.secondary }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {profile.industries.length > 0 && (
              <View>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Industries</Text>
                <View style={styles.tagRow}>
                  {profile.industries.slice(0, 6).map((i) => (
                    <View key={i} style={[styles.tag, { backgroundColor: `${theme.accent}14` }]}>
                      <Text style={[styles.tagText, { color: theme.accent }]}>{i}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <TouchableOpacity style={[styles.editSectionBtn, { borderColor: theme.border }]} onPress={() => openEdit('professional')}>
              <Ionicons name="pencil-outline" size={14} color={theme.mutedForeground} />
              <Text style={[styles.editSectionText, { color: theme.mutedForeground }]}>Edit</Text>
            </TouchableOpacity>
          </Section>
        </View>

        {/* ── Job search ──────────────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Section title="Job Search" icon="search-outline" color={theme.primary}>
            {profile.targetRoles.length > 0 && (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Target roles</Text>
                <View style={styles.tagRow}>
                  {profile.targetRoles.map((r) => (
                    <View key={r} style={[styles.tag, { backgroundColor: `${theme.primary}12` }]}>
                      <Text style={[styles.tagText, { color: theme.primary }]}>{r}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {profile.workStyle.length > 0 && (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Work style</Text>
                <View style={styles.tagRow}>
                  {profile.workStyle.map((w) => (
                    <View key={w} style={[styles.tag, { backgroundColor: `${theme.primary}12` }]}>
                      <Text style={[styles.tagText, { color: theme.primary }]}>{w}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {(profile.salaryMin || profile.salaryMax) && (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Salary range</Text>
                <Text style={[styles.fieldValue, { color: theme.foreground }]}>
                  {profile.salaryMin ? `$${profile.salaryMin}` : ''}{profile.salaryMin && profile.salaryMax ? ' – ' : ''}{profile.salaryMax ? `$${profile.salaryMax}` : ''}
                </Text>
              </View>
            )}
            {profile.openToRoles ? (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Open to</Text>
                <Text style={[styles.fieldValue, { color: theme.foreground }]}>{profile.openToRoles}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={[styles.editSectionBtn, { borderColor: theme.border }]} onPress={() => openEdit('jobSearch')}>
              <Ionicons name="pencil-outline" size={14} color={theme.mutedForeground} />
              <Text style={[styles.editSectionText, { color: theme.mutedForeground }]}>Edit</Text>
            </TouchableOpacity>
          </Section>
        </View>

        {/* ── Networking ──────────────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Section title="Networking & Collaboration" icon="people-outline" color={theme.accent}>
            {profile.networkingGoals ? (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Looking for</Text>
                <Text style={[styles.fieldValue, { color: theme.foreground }]}>{profile.networkingGoals}</Text>
              </View>
            ) : null}
            {profile.projectIdeas.length > 0 && (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Project ideas</Text>
                {profile.projectIdeas.map((idea) => (
                  <View key={idea} style={styles.ideaRow}>
                    <Ionicons name="bulb-outline" size={14} color={theme.accent} />
                    <Text style={[styles.fieldValue, { color: theme.foreground }]}>{idea}</Text>
                  </View>
                ))}
              </View>
            )}
            {profile.openTo.length > 0 && (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>Open to</Text>
                <View style={styles.tagRow}>
                  {profile.openTo.map((o) => (
                    <View key={o} style={[styles.tag, { backgroundColor: `${theme.accent}14` }]}>
                      <Text style={[styles.tagText, { color: theme.accent }]}>{o}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <TouchableOpacity style={[styles.editSectionBtn, { borderColor: theme.border }]} onPress={() => openEdit('networking')}>
              <Ionicons name="pencil-outline" size={14} color={theme.mutedForeground} />
              <Text style={[styles.editSectionText, { color: theme.mutedForeground }]}>Edit</Text>
            </TouchableOpacity>
          </Section>
        </View>

        {/* ── Resume status ────────────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <TouchableOpacity
            style={[styles.resumeCard, { backgroundColor: resume ? `${theme.success}10` : `${theme.primary}08`, borderColor: resume ? `${theme.success}35` : `${theme.primary}25` }]}
            onPress={() => navigation.navigate('ResumeUpload')}
            activeOpacity={0.75}
          >
            <View style={[styles.resumeIcon, { backgroundColor: resume ? `${theme.success}20` : `${theme.primary}15` }]}>
              <Ionicons name={resume ? 'document-text' : 'document-text-outline'} size={24} color={resume ? theme.success : theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.resumeTitle, { color: theme.foreground }]}>
                {resume ? 'Resume uploaded' : 'Upload your resume'}
              </Text>
              <Text style={[styles.resumeSub, { color: theme.mutedForeground }]}>
                {resume ? `Last updated ${new Date(resume.lastUpdated).toLocaleDateString()}` : 'Powers AI match scoring & auto-tailoring'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── Quick links ──────────────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          {[
            { title: 'Job Preferences', sub: 'Filters, location, remote', icon: 'options-outline' as const, color: theme.primary, screen: 'JobFilters' },
            { title: 'Account Settings', sub: 'Theme, AI Tailor, privacy', icon: 'settings-outline' as const, color: theme.secondary, screen: 'Settings' },
            { title: 'Help & Support', sub: 'FAQ and feedback', icon: 'help-circle-outline' as const, color: theme.warning, screen: 'Help' },
          ].map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.quickLink, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickLinkIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickLinkTitle, { color: theme.foreground }]}>{item.title}</Text>
                <Text style={[styles.quickLinkSub, { color: theme.mutedForeground }]}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Sign out ─────────────────────────────────────────────────────── */}
        <View style={[styles.sectionWrap, { marginBottom: 0 }]}>
          <TouchableOpacity
            style={[styles.signOutBtn, { borderColor: theme.destructive }]}
            onPress={() => Alert.alert('Sign out', 'Sign out of SwipeConnect?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: logout },
            ])}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.destructive} />
            <Text style={[styles.signOutText, { color: theme.destructive }]}>Sign out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {renderEditModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 140 },
  // Hero
  heroCard: { margin: Spacing.xl, borderRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing['2xl'], alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: Spacing.lg },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3 },
  avatarFallback: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroName: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, textAlign: 'center', marginBottom: 4 },
  heroTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'center', marginBottom: 4 },
  heroLocation: { fontSize: FontSize.sm, textAlign: 'center', marginBottom: Spacing.md },
  heroBio: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.md },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.lg },
  socialTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 5 },
  socialTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  completionWrap: { width: '100%', marginBottom: Spacing.lg },
  completionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  completionLabel: { fontSize: FontSize.xs },
  completionPct: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold },
  completionBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 3 },
  editHeroBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  editHeroBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  // Sections
  sectionWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.lg },
  sectionIconBox: { width: 34, height: 34, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: FontSize.sm, lineHeight: 20 },
  ideaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, gap: 4 },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  chip: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  editSectionBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: 6, alignSelf: 'flex-start', marginTop: Spacing.md },
  editSectionText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  // Resume card
  resumeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md },
  resumeIcon: { width: 48, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  resumeTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 2 },
  resumeSub: { fontSize: FontSize.sm },
  // Quick links
  quickLink: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.sm },
  quickLinkIcon: { width: 40, height: 40, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  quickLinkTitle: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  quickLinkSub: { fontSize: FontSize.sm, marginTop: 1 },
  // Sign out
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 52, borderRadius: BorderRadius.lg, borderWidth: 1.5, marginBottom: Spacing['3xl'] },
  signOutText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  // Tag editor
  tagInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  tagInputText: { flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.sm },
  tagAddBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  tagAddText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  // Text field
  textField: { borderWidth: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, minHeight: 44 },
  // Salary
  salaryRow: { flexDirection: 'row', gap: Spacing.md },
  salarySep: { width: 1, marginTop: 28 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '90%', borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing.xl },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: Spacing.lg },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  modalFooter: { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.lg, borderTopWidth: 1 },
  cancelBtn: { flex: 1, height: 48, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  saveBtn: { flex: 2, height: 48, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },
});

export default ProfileScreen;
