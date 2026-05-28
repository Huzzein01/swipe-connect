import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { jobService } from '../services/jobService';
import { detailSectionsForJob, summarizeDescription } from '../services/simulatedJobs';
import { Job } from '../types/job';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type JobSwipeScreenProps = {
  navigation: any;
};

type DeckMode = 'jobs' | 'networking';

type NetworkProfile = {
  id: string;
  name: string;
  title: string;
  location: string;
  avatar: string;
  matchScore: number;
  lookingFor: string;
  summary: string;
  skills: string[];
  ideas: string[];
};

const networkProfiles: NetworkProfile[] = [
  {
    id: 'maya-founder',
    name: 'Maya Johnson',
    title: 'AI Product Founder',
    location: 'Austin, TX',
    avatar: 'MJ',
    matchScore: 94,
    lookingFor: 'Technical cofounder for workflow automation tools',
    summary: 'Building a lightweight AI operations assistant for small service businesses.',
    skills: ['Product Strategy', 'AI Tools', 'Fundraising'],
    ideas: ['Vertical AI agents', 'SMB automation', 'Customer onboarding'],
  },
  {
    id: 'darius-engineer',
    name: 'Darius Lee',
    title: 'Full-stack Engineer',
    location: 'Remote - US',
    avatar: 'DL',
    matchScore: 90,
    lookingFor: 'Founder-led projects with clear customer pain',
    summary: 'Ships React Native, Node, and data products from prototype to launch.',
    skills: ['React Native', 'Node.js', 'MongoDB'],
    ideas: ['Mobile marketplaces', 'Job automation', 'Developer tools'],
  },
  {
    id: 'amina-growth',
    name: 'Amina Okafor',
    title: 'Growth Marketer',
    location: 'Chicago, IL',
    avatar: 'AO',
    matchScore: 87,
    lookingFor: 'Early-stage team to validate acquisition channels',
    summary: 'Turns messy GTM ideas into repeatable campaigns, lifecycle flows, and analytics loops.',
    skills: ['Lifecycle', 'Paid Social', 'Analytics'],
    ideas: ['Community-led growth', 'Creator partnerships', 'B2B funnels'],
  },
];

const JobSwipeScreen = ({ navigation }: JobSwipeScreenProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { preferences, resume } = useDemo();
  const [mode, setMode] = useState<DeckMode>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviewedJobIds, setReviewedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [networkReviewedIds, setNetworkReviewedIds] = useState<string[]>([]);
  const [networkSavedIds, setNetworkSavedIds] = useState<string[]>([]);
  const [isFetchingJobs, setIsFetchingJobs] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      setIsFetchingJobs(true);
      const fetchedJobs = await jobService.getJobs(preferences);
      if (isMounted) {
        setJobs(fetchedJobs);
        setReviewedJobIds([]);
        setIsFetchingJobs(false);
      }
    };

    loadJobs();
    return () => {
      isMounted = false;
    };
  }, [preferences]);

  const remainingJobs = useMemo(
    () => jobs.filter((job) => !reviewedJobIds.includes(job.id)),
    [jobs, reviewedJobIds]
  );
  const currentJob = remainingJobs[0] || null;
  const nextJob = remainingJobs[1] || null;
  const remainingProfiles = networkProfiles.filter((profile) => !networkReviewedIds.includes(profile.id));
  const currentProfile = remainingProfiles[0] || null;
  const activeCount = mode === 'jobs' ? jobs.length : networkProfiles.length;
  const activeRemaining = mode === 'jobs' ? remainingJobs.length : remainingProfiles.length;

  const resetCard = () => {
    translateX.value = 0;
    translateY.value = 0;
  };

  const handleModeChange = (nextMode: DeckMode) => {
    setMode(nextMode);
    setStatusMessage(null);
    resetCard();
  };

  const recordLocalSwipe = (jobId: string, action: 'apply' | 'skip') => {
    setReviewedJobIds((ids) => Array.from(new Set([...ids, jobId])));
    if (action === 'apply') {
      setAppliedJobIds((ids) => Array.from(new Set([...ids, jobId])));
    }
  };

  const handleJobSwipe = async (direction: 'left' | 'right') => {
    if (!currentJob || isLoading) return;

    if (direction === 'right') {
      setIsLoading(true);
      try {
        await jobService.recordSwipe(currentJob.id, 'like');
        const application = await jobService.applyToJob(
          currentJob,
          {
            id: user?.uid,
            name: user?.displayName,
            email: user?.email,
            phone: resume?.parsedData.phone,
          },
          resume
        );
        recordLocalSwipe(currentJob.id, 'apply');
        setStatusMessage(
          application.email?.sent
            ? `Applied to ${currentJob.company}. Confirmation sent.`
            : `Applied to ${currentJob.company}. Confirmation queued.`
        );
      } catch (error) {
        recordLocalSwipe(currentJob.id, 'apply');
        setStatusMessage(`Applied locally to ${currentJob.company}.`);
      } finally {
        setIsLoading(false);
      }
    } else {
      await jobService.recordSwipe(currentJob.id, 'dislike');
      recordLocalSwipe(currentJob.id, 'skip');
      setStatusMessage(`${currentJob.company} skipped.`);
    }
    resetCard();
  };

  const handleNetworkSwipe = (direction: 'left' | 'right') => {
    if (!currentProfile) return;
    setNetworkReviewedIds((ids) => Array.from(new Set([...ids, currentProfile.id])));
    if (direction === 'right') {
      setNetworkSavedIds((ids) => Array.from(new Set([...ids, currentProfile.id])));
      setStatusMessage(`${currentProfile.name} added to your networking shortlist.`);
    } else {
      setStatusMessage(`${currentProfile.name} skipped.`);
    }
    resetCard();
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (mode === 'jobs') {
      handleJobSwipe(direction);
      return;
    }
    handleNetworkSwipe(direction);
  };

  const handleSave = async () => {
    if (mode === 'networking') {
      if (!currentProfile) return;
      setNetworkReviewedIds((ids) => Array.from(new Set([...ids, currentProfile.id])));
      setNetworkSavedIds((ids) => Array.from(new Set([...ids, currentProfile.id])));
      setStatusMessage(`${currentProfile.name} saved for phase two networking.`);
      resetCard();
      return;
    }

    if (!currentJob || isLoading) return;
    await jobService.saveJob(currentJob.id);
    setReviewedJobIds((ids) => Array.from(new Set([...ids, currentJob.id])));
    setSavedJobIds((ids) => Array.from(new Set([...ids, currentJob.id])));
    setStatusMessage(`${currentJob.title} at ${currentJob.company} saved.`);
    resetCard();
  };

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: (event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { damping: 15 }
        );
        runOnJS(handleSwipe)(event.translationX > 0 ? 'right' : 'left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-14, 0, 14],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const applyOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SCREEN_WIDTH * 0.28], [0, 1], Extrapolation.CLAMP),
  }));

  const skipOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SCREEN_WIDTH * 0.28, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const formatSalary = (salary?: Job['salary']) => {
    if (!salary?.min || !salary?.max) return 'Compensation pending';
    return `$${Math.round(salary.min / 1000)}k - $${Math.round(salary.max / 1000)}k`;
  };

  const renderJobCard = (job: Job, isPreview = false) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, isPreview && styles.previewCard]}>
      <View style={styles.cardHeader}>
        <View style={[styles.logoMark, { backgroundColor: `${theme.primary}18` }]}>
          <Text style={[styles.logoText, { color: theme.primary }]}>{job.company.slice(0, 1)}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={[styles.companyName, { color: theme.mutedForeground }]} numberOfLines={1}>
            {job.company}
          </Text>
          <Text style={[styles.jobTitle, { color: theme.foreground }]} numberOfLines={2}>
            {job.title}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${theme.success}16` }]}>
          <Text style={[styles.scoreText, { color: theme.success }]}>{job.matchScore || 78}%</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={[styles.metaPill, { backgroundColor: theme.muted }]}>
          <Ionicons name="location-outline" size={14} color={theme.mutedForeground} />
          <Text style={[styles.metaText, { color: theme.foreground }]} numberOfLines={1}>{job.location}</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: theme.muted }]}>
          <Ionicons name="cash-outline" size={14} color={theme.mutedForeground} />
          <Text style={[styles.metaText, { color: theme.foreground }]}>{formatSalary(job.salary)}</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: theme.muted }]}>
          <Ionicons name={job.remote ? 'globe-outline' : 'business-outline'} size={14} color={theme.mutedForeground} />
          <Text style={[styles.metaText, { color: theme.foreground }]}>{job.workStyle || (job.remote ? 'Remote' : 'Hybrid')}</Text>
        </View>
      </View>

      <View style={[styles.summaryPanel, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}24` }]}>
        <Text style={[styles.blockLabel, { color: theme.primary }]}>Quick summary</Text>
        <Text style={[styles.description, { color: theme.foreground }]}>
          {summarizeDescription(job.description, 250)}
        </Text>
        <TouchableOpacity onPress={() => setDetailJob(job)} style={styles.moreButton} activeOpacity={0.75}>
          <Text style={[styles.moreText, { color: theme.primary }]}>See more</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={[styles.blockLabel, { color: theme.mutedForeground }]}>Why it matches</Text>
        {(job.whyMatch || ['Relevant role', 'Application link available']).slice(0, 3).map((reason) => (
          <View key={reason} style={styles.reasonRow}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success} />
            <Text style={[styles.reasonText, { color: theme.foreground }]} numberOfLines={1}>{reason}</Text>
          </View>
        ))}
      </View>

      <View style={styles.skillsRow}>
        {job.requirements.slice(0, 5).map((skill) => (
          <View key={skill} style={[styles.skillTag, { backgroundColor: `${theme.secondary}14` }]}>
            <Text style={[styles.skillText, { color: theme.secondary }]}>{skill}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderNetworkCard = (profile: NetworkProfile) => (
    <View style={[styles.card, styles.networkCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.logoMark, { backgroundColor: `${theme.accent}18` }]}>
          <Text style={[styles.logoText, { color: theme.accent }]}>{profile.avatar}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={[styles.companyName, { color: theme.mutedForeground }]}>{profile.title}</Text>
          <Text style={[styles.jobTitle, { color: theme.foreground }]}>{profile.name}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${theme.accent}16` }]}>
          <Text style={[styles.scoreText, { color: theme.accent }]}>{profile.matchScore}%</Text>
        </View>
      </View>

      <Text style={[styles.networkHeadline, { color: theme.foreground }]}>{profile.lookingFor}</Text>
      <Text style={[styles.description, { color: theme.mutedForeground }]}>{profile.summary}</Text>
      <View style={[styles.summaryPanel, { backgroundColor: `${theme.accent}08`, borderColor: `${theme.accent}24` }]}>
        <Text style={[styles.blockLabel, { color: theme.accent }]}>Collaboration ideas</Text>
        {profile.ideas.map((idea) => (
          <View key={idea} style={styles.reasonRow}>
            <Ionicons name="bulb-outline" size={16} color={theme.accent} />
            <Text style={[styles.reasonText, { color: theme.foreground }]}>{idea}</Text>
          </View>
        ))}
      </View>
      <View style={styles.skillsRow}>
        {profile.skills.map((skill) => (
          <View key={skill} style={[styles.skillTag, { backgroundColor: `${theme.primary}12` }]}>
            <Text style={[styles.skillText, { color: theme.primary }]}>{skill}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const detailSections = detailJob ? detailSectionsForJob(detailJob) : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: theme.mutedForeground }]}>
            {mode === 'jobs' ? 'Job applications' : 'Professional networking'}
          </Text>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>
            {mode === 'jobs' ? 'Swipe roles' : 'Swipe collaborators'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('JobFilters')}
          activeOpacity={0.75}
        >
          <Ionicons name="options-outline" size={20} color={theme.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.modeToggle, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['jobs', 'networking'] as DeckMode[]).map((item) => {
          const selected = mode === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.modeButton, selected && { backgroundColor: theme.primary }]}
              onPress={() => handleModeChange(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item === 'jobs' ? 'briefcase-outline' : 'people-outline'}
                size={16}
                color={selected ? theme.primaryForeground : theme.mutedForeground}
              />
              <Text style={[styles.modeText, { color: selected ? theme.primaryForeground : theme.foreground }]}>
                {item === 'jobs' ? 'Jobs' : 'Networking'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, { backgroundColor: `${theme.accent}14` }]}>
          <Text style={[styles.summaryValue, { color: theme.accent }]}>{mode === 'jobs' ? appliedJobIds.length : networkSavedIds.length}</Text>
          <Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>{mode === 'jobs' ? 'Applied' : 'Matched'}</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: `${theme.secondary}12` }]}>
          <Text style={[styles.summaryValue, { color: theme.secondary }]}>{mode === 'jobs' ? savedJobIds.length : networkSavedIds.length}</Text>
          <Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>Saved</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: `${theme.primary}10` }]}>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>{activeRemaining}/{activeCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>In deck</Text>
        </View>
      </View>

      {statusMessage && (
        <View style={[styles.statusBanner, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}55` }]}>
          <Ionicons name="checkmark-circle" size={18} color={theme.success} />
          <Text style={[styles.statusText, { color: theme.foreground }]}>{statusMessage}</Text>
        </View>
      )}

      <View style={styles.deckArea}>
        {isFetchingJobs && mode === 'jobs' ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>Building your swipe deck...</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>Adding to your pipeline...</Text>
          </View>
        ) : (mode === 'jobs' ? currentJob : currentProfile) ? (
          <View style={styles.cardStage}>
            {mode === 'jobs' && nextJob && <View style={styles.previewWrap}>{renderJobCard(nextJob, true)}</View>}
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.activeCardWrap, cardStyle]}>
                <Animated.View style={[styles.swipeLabel, styles.applyLabel, applyOpacity]}>
                  <Text style={[styles.swipeLabelText, { color: theme.success }]}>{mode === 'jobs' ? 'APPLY' : 'CONNECT'}</Text>
                </Animated.View>
                <Animated.View style={[styles.swipeLabel, styles.skipLabel, skipOpacity]}>
                  <Text style={[styles.swipeLabelText, { color: theme.destructive }]}>SKIP</Text>
                </Animated.View>
                {mode === 'jobs' && currentJob ? renderJobCard(currentJob) : currentProfile ? renderNetworkCard(currentProfile) : null}
              </Animated.View>
            </PanGestureHandler>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}12` }]}>
              <Ionicons name="checkmark-done-outline" size={42} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>Deck complete</Text>
            <Text style={[styles.emptySubtitle, { color: theme.mutedForeground }]}>
              {mode === 'jobs' ? 'You reached the end of this job deck.' : 'You reached the end of the networking preview.'}
            </Text>
          </View>
        )}
      </View>

      {(mode === 'jobs' ? currentJob : currentProfile) && !isLoading && (
        <View style={styles.actions}>
          <Pressable style={[styles.actionButton, { borderColor: theme.destructive, backgroundColor: theme.card }]} onPress={() => handleSwipe('left')} accessibilityRole="button" accessibilityLabel={mode === 'jobs' ? 'Skip job' : 'Skip profile'}>
            <Ionicons name="close" size={28} color={theme.destructive} />
          </Pressable>
          <Pressable style={[styles.saveButton, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={handleSave} accessibilityRole="button" accessibilityLabel={mode === 'jobs' ? 'Save job' : 'Save profile'}>
            <Ionicons name="bookmark-outline" size={24} color={theme.foreground} />
          </Pressable>
          <Pressable style={[styles.actionButton, { borderColor: theme.success, backgroundColor: `${theme.success}12` }]} onPress={() => handleSwipe('right')} accessibilityRole="button" accessibilityLabel={mode === 'jobs' ? 'Apply job' : 'Connect profile'}>
            <Ionicons name={mode === 'jobs' ? 'send' : 'people'} size={26} color={theme.success} />
          </Pressable>
        </View>
      )}

      <Modal visible={Boolean(detailJob)} animationType="slide" transparent onRequestClose={() => setDetailJob(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Text style={[styles.companyName, { color: theme.mutedForeground }]}>{detailJob?.company}</Text>
                <Text style={[styles.modalTitle, { color: theme.foreground }]}>{detailJob?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailJob(null)} style={[styles.closeButton, { backgroundColor: theme.muted }]}>
                <Ionicons name="close" size={20} color={theme.foreground} />
              </TouchableOpacity>
            </View>
            {detailSections && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.detailSectionTitle, { color: theme.primary }]}>Overview</Text>
                <Text style={[styles.detailText, { color: theme.foreground }]}>{detailSections.overview}</Text>
                <Text style={[styles.detailSectionTitle, { color: theme.primary }]}>Responsibilities</Text>
                {detailSections.responsibilities.map((item) => (
                  <Text key={item} style={[styles.detailBullet, { color: theme.foreground }]}>- {item}</Text>
                ))}
                <Text style={[styles.detailSectionTitle, { color: theme.primary }]}>Requirements</Text>
                {detailSections.requirements.map((item) => (
                  <Text key={item} style={[styles.detailBullet, { color: theme.foreground }]}>- {item}</Text>
                ))}
                <Text style={[styles.detailSectionTitle, { color: theme.primary }]}>Benefits</Text>
                {detailSections.benefits.map((item) => (
                  <Text key={item} style={[styles.detailBullet, { color: theme.foreground }]}>- {item}</Text>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  kicker: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 2 },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    padding: 4,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  modeText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  summaryRow: { flexDirection: 'row', gap: Spacing.md, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
  summaryPill: { flex: 1, borderRadius: BorderRadius.xl, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md },
  summaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  summaryLabel: { fontSize: FontSize.xs, marginTop: 2 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  deckArea: { flex: 1, paddingHorizontal: Spacing.xl },
  cardStage: { flex: 1, justifyContent: 'center' },
  previewWrap: { position: 'absolute', left: 8, right: 8, top: 24, opacity: 0.45, transform: [{ scale: 0.96 }] },
  activeCardWrap: { maxHeight: '100%' },
  card: { borderWidth: 1, borderRadius: BorderRadius['2xl'], padding: Spacing.xl },
  previewCard: { minHeight: 420 },
  networkCard: { minHeight: 420 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  logoMark: { width: 52, height: 52, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  logoText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  cardTitleBlock: { flex: 1, paddingRight: Spacing.sm },
  companyName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 3 },
  jobTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, lineHeight: 26 },
  scoreBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  scoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  metaPill: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs, maxWidth: '100%' },
  metaText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  summaryPanel: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  description: { fontSize: FontSize.md, lineHeight: 23 },
  moreButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, marginTop: Spacing.md },
  moreText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  sectionBlock: { marginBottom: Spacing.lg, gap: Spacing.sm },
  blockLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: Spacing.sm },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  reasonText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skillTag: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  skillText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  networkHeadline: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, lineHeight: 25, marginBottom: Spacing.md },
  swipeLabel: { position: 'absolute', top: 28, zIndex: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 3, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(255,255,255,0.92)' },
  applyLabel: { right: 24, borderColor: '#10B981' },
  skipLabel: { left: 24, borderColor: '#EF4444' },
  swipeLabelText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'] },
  loadingText: { fontSize: FontSize.md, marginTop: Spacing.md },
  emptyIcon: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xl, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  actionButton: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  saveButton: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { maxHeight: '82%', borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing.xl },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  modalTitleBlock: { flex: 1, paddingRight: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, lineHeight: 26 },
  closeButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  detailSectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  detailText: { fontSize: FontSize.md, lineHeight: 24 },
  detailBullet: { fontSize: FontSize.md, lineHeight: 24, marginBottom: Spacing.xs },
});

export default JobSwipeScreen;
