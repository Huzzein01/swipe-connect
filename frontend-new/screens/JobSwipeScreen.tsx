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
import { Job } from '../types/job';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type JobSwipeScreenProps = {
  navigation: any;
};

const JobSwipeScreen = ({ navigation }: JobSwipeScreenProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { preferences, resume } = useDemo();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviewedJobIds, setReviewedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [skippedJobIds, setSkippedJobIds] = useState<string[]>([]);
  const [isFetchingJobs, setIsFetchingJobs] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      setIsFetchingJobs(true);
      const fetchedJobs = await jobService.getJobs(preferences);
      if (isMounted) {
        setJobs(fetchedJobs);
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
  const stats = {
    reviewed: reviewedJobIds.length,
    applied: appliedJobIds.length,
    saved: savedJobIds.length,
    remaining: remainingJobs.length,
  };
  const currentJob = remainingJobs[0] || null;
  const nextJob = remainingJobs[1] || null;
  const progress = currentJob ? Math.min(stats.reviewed + 1, jobs.length) : jobs.length;

  const resetDeck = () => {
    setReviewedJobIds([]);
    setAppliedJobIds([]);
    setSavedJobIds([]);
    setSkippedJobIds([]);
    resetCard();
  };

  const recordLocalSwipe = (jobId: string, action: 'apply' | 'skip') => {
    setReviewedJobIds((ids) => Array.from(new Set([...ids, jobId])));
    if (action === 'apply') {
      setAppliedJobIds((ids) => Array.from(new Set([...ids, jobId])));
    } else {
      setSkippedJobIds((ids) => Array.from(new Set([...ids, jobId])));
    }
  };

  const resetCard = () => {
    translateX.value = 0;
    translateY.value = 0;
  };

  const advanceDeck = () => {
    resetCard();
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
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
        Alert.alert(
          'Application queued',
          `${currentJob.title} at ${currentJob.company} is ready. A confirmation was prepared for ${application.applicant.email}.`
        );
        setStatusMessage(
          application.email?.sent
            ? `Application queued for ${currentJob.company}. Email sent to ${application.applicant.email}.`
            : `Application queued for ${currentJob.company}. Confirmation prepared for ${application.applicant.email}.`
        );
      } catch (error) {
        recordLocalSwipe(currentJob.id, 'apply');
        Alert.alert(
          'Application staged',
          `${currentJob.title} at ${currentJob.company} was added locally. Start the backend to send confirmations.`
        );
        setStatusMessage(`Application staged locally for ${currentJob.company}.`);
      } finally {
        setIsLoading(false);
      }
      advanceDeck();
    } else {
      await jobService.recordSwipe(currentJob.id, 'dislike');
      recordLocalSwipe(currentJob.id, 'skip');
      setStatusMessage(`${currentJob.company} skipped.`);
      advanceDeck();
    }
  };

  const handleSave = async () => {
    if (!currentJob || isLoading) return;
    await jobService.saveJob(currentJob.id);
    setReviewedJobIds((ids) => Array.from(new Set([...ids, currentJob.id])));
    setSavedJobIds((ids) => Array.from(new Set([...ids, currentJob.id])));
    Alert.alert('Saved', `${currentJob.title} is saved for later.`);
    setStatusMessage(`${currentJob.title} at ${currentJob.company} saved for later.`);
    advanceDeck();
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
      [-18, 0, 18],
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
    if (!salary) return 'Compensation pending';
    return `$${Math.round(salary.min / 1000)}k - $${Math.round(salary.max / 1000)}k`;
  };

  const renderCard = (job: Job, isPreview = false) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: isPreview ? 0.58 : 1,
        },
        isPreview && styles.previewCard,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.logoMark, { backgroundColor: `${theme.primary}14` }]}>
          <Text style={[styles.logoText, { color: theme.primary }]}>{job.company.slice(0, 1)}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={[styles.companyName, { color: theme.mutedForeground }]}>{job.company}</Text>
          <Text style={[styles.jobTitle, { color: theme.foreground }]} numberOfLines={2}>
            {job.title}
          </Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${theme.success}15` }]}>
          <Text style={[styles.scoreText, { color: theme.success }]}>{job.matchScore || 78}%</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={[styles.metaPill, { backgroundColor: theme.muted }]}>
          <Ionicons name="location-outline" size={15} color={theme.mutedForeground} />
          <Text style={[styles.metaText, { color: theme.foreground }]} numberOfLines={1}>
            {job.location}
          </Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: theme.muted }]}>
          <Ionicons name="cash-outline" size={15} color={theme.mutedForeground} />
          <Text style={[styles.metaText, { color: theme.foreground }]}>{formatSalary(job.salary)}</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: theme.muted }]}>
          <Ionicons name="trending-up-outline" size={15} color={theme.mutedForeground} />
          <Text style={[styles.metaText, { color: theme.foreground }]}>{job.companyStage || job.industry}</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: theme.muted }]}>
          <Ionicons name="calendar-outline" size={15} color={theme.mutedForeground} />
          <Text style={[styles.metaText, { color: theme.foreground }]}>{job.workStyle || (job.remote ? 'Remote' : 'Hybrid')}</Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme.foreground }]}>{job.description}</Text>

      <View style={styles.sectionBlock}>
        <Text style={[styles.blockLabel, { color: theme.mutedForeground }]}>Why it matches</Text>
        <View style={styles.reasonStack}>
          {(job.whyMatch || ['Relevant skills detected', 'Application link available']).map((reason) => (
            <View key={reason} style={styles.reasonRow}>
              <Ionicons name="checkmark-circle" size={17} color={theme.success} />
              <Text style={[styles.reasonText, { color: theme.foreground }]}>{reason}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.skillsRow}>
        {job.requirements.map((skill) => (
          <View key={skill} style={[styles.skillTag, { backgroundColor: `${theme.secondary}14` }]}>
            <Text style={[styles.skillText, { color: theme.secondary }]}>{skill}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: theme.mutedForeground }]}>Discover</Text>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Your job deck</Text>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('JobFilters')}
          activeOpacity={0.75}
        >
          <Ionicons name="options-outline" size={20} color={theme.foreground} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryPill, { backgroundColor: `${theme.primary}12` }]}>
          <Text style={[styles.summaryValue, { color: theme.primary }]}>{progress}/{jobs.length}</Text>
          <Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>Reviewed</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: `${theme.accent}14` }]}>
          <Text style={[styles.summaryValue, { color: theme.accent }]}>{stats.applied}</Text>
          <Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>Applied</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: `${theme.secondary}12` }]}>
          <Text style={[styles.summaryValue, { color: theme.secondary }]}>{stats.saved}</Text>
          <Text style={[styles.summaryLabel, { color: theme.mutedForeground }]}>Saved</Text>
        </View>
      </View>

      {statusMessage && (
        <View style={[styles.statusBanner, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}55` }]}>
          <Ionicons name="checkmark-circle" size={18} color={theme.success} />
          <Text style={[styles.statusText, { color: theme.foreground }]}>{statusMessage}</Text>
        </View>
      )}

      <View style={styles.deckArea}>
        {isFetchingJobs ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>Loading live job feed...</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>Adding to your pipeline...</Text>
          </View>
        ) : currentJob ? (
          <View style={styles.cardStage}>
            {nextJob && <View style={styles.previewWrap}>{renderCard(nextJob, true)}</View>}
            <PanGestureHandler onGestureEvent={gestureHandler}>
              <Animated.View style={[styles.activeCardWrap, cardStyle]}>
                <Animated.View style={[styles.swipeLabel, styles.applyLabel, applyOpacity]}>
                  <Text style={[styles.swipeLabelText, { color: theme.success }]}>APPLY</Text>
                </Animated.View>
                <Animated.View style={[styles.swipeLabel, styles.skipLabel, skipOpacity]}>
                  <Text style={[styles.swipeLabelText, { color: theme.destructive }]}>SKIP</Text>
                </Animated.View>
                <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                  {renderCard(currentJob)}
                </ScrollView>
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
              You reviewed every role in today's shortlist.
            </Text>
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.primary }]}
              onPress={resetDeck}
              activeOpacity={0.85}
            >
              <Text style={[styles.resetButtonText, { color: theme.primaryForeground }]}>Review again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {currentJob && !isLoading && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { borderColor: theme.destructive, backgroundColor: theme.card }]}
            onPress={() => handleSwipe('left')}
            accessibilityRole="button"
            accessibilityLabel="Skip job"
          >
            <Ionicons name="close" size={28} color={theme.destructive} />
          </Pressable>
          <Pressable
            style={[styles.saveButton, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save job"
          >
            <Ionicons name="bookmark-outline" size={24} color={theme.foreground} />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { borderColor: theme.success, backgroundColor: `${theme.success}12` }]}
            onPress={() => handleSwipe('right')}
            accessibilityRole="button"
            accessibilityLabel="Apply job"
          >
            <Ionicons name="send" size={26} color={theme.success} />
          </Pressable>
        </View>
      )}
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
  kicker: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  summaryPill: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  summaryValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
  },
  summaryLabel: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
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
  statusText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  deckArea: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  cardStage: {
    flex: 1,
    justifyContent: 'center',
  },
  previewWrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 22,
    bottom: 12,
    transform: [{ scale: 0.96 }],
  },
  activeCardWrap: {
    maxHeight: '100%',
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
  },
  previewCard: {
    minHeight: 520,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  logoText: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
  },
  cardTitleBlock: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  companyName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: 3,
  },
  jobTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    lineHeight: 26,
  },
  scoreBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  scoreText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    maxWidth: '100%',
  },
  metaText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  description: {
    fontSize: FontSize.md,
    lineHeight: 23,
    marginBottom: Spacing.xl,
  },
  sectionBlock: {
    marginBottom: Spacing.lg,
  },
  blockLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.md,
  },
  reasonStack: {
    gap: Spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  reasonText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  skillTag: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  skillText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  swipeLabel: {
    position: 'absolute',
    top: 28,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  applyLabel: { right: 24, borderColor: '#10B981' },
  skipLabel: { left: 24, borderColor: '#EF4444' },
  swipeLabelText: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    letterSpacing: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  loadingText: {
    fontSize: FontSize.md,
    marginTop: Spacing.md,
  },
  emptyIcon: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  resetButton: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  resetButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default JobSwipeScreen;
