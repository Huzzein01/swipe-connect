import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../contexts/DemoContext';
import { useNetwork, NETWORK_PROFILES, NetworkProfile } from '../contexts/NetworkContext';
import { usePremium } from '../contexts/PremiumContext';
import { useNotifications } from '../contexts/NotificationContext';
import { analyzeJobMatch, tailorResumeForJob, MatchAnalysis, TailoredResume } from '../services/aiService';
import { jobService } from '../services/jobService';
import { detailSectionsForJob, summarizeDescription } from '../services/simulatedJobs';
import { Job } from '../types/job';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const CARD_HEIGHT = Math.min(SCREEN_HEIGHT * 0.62, 520);

type DeckMode = 'jobs' | 'networking';
type Props = { navigation: any };

const JobSwipeScreen = ({ navigation }: Props) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { preferences, resume } = useDemo();
  const { addMatch } = useNetwork();
  const { aiTailorEnabled } = usePremium();
  const { addNotification } = useNotifications();

  const [mode, setMode] = useState<DeckMode>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reviewedJobIds, setReviewedJobIds] = useState<string[]>([]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [networkReviewedIds, setNetworkReviewedIds] = useState<string[]>([]);
  const [isFetchingJobs, setIsFetchingJobs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [detailProfile, setDetailProfile] = useState<NetworkProfile | null>(null);

  // AI match analysis cache: jobId → MatchAnalysis
  const [aiScores, setAiScores] = useState<Record<string, MatchAnalysis>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // AI tailor state
  const [tailorModal, setTailorModal] = useState<{ job: Job; result: TailoredResume } | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);

  // ─── Shared animation values (declared first — used in gesture below) ──────
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(0);

  // ─── Data: hashmap-backed deck with continuous top-up ─────────────────────
  // jobsMapRef dedupes every job ever fetched (company+title key → Job), so the
  // deck only grows and never shows the same role twice.
  const jobsMapRef = React.useRef<Map<string, Job>>(new Map());
  const toppingUpRef = React.useRef(false);
  const TOPUP_THRESHOLD = 6;

  const keyOf = (j: Job) => `${j.company?.toLowerCase()}-${j.title?.toLowerCase()}`;

  const mergeIntoDeck = useCallback((incoming: Job[]) => {
    const map = jobsMapRef.current;
    let added = 0;
    for (const job of incoming) {
      const k = keyOf(job);
      if (job.title && job.applicationUrl && !map.has(k)) { map.set(k, job); added++; }
    }
    if (added > 0) {
      setJobs(Array.from(map.values()).sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)));
    }
    return added;
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsFetchingJobs(true);
      jobsMapRef.current = new Map();
      const fetched = await jobService.getJobs(preferences);
      if (!mounted) return;
      setReviewedJobIds([]);
      mergeIntoDeck(fetched);
      setIsFetchingJobs(false);
    };
    load();
    return () => { mounted = false; };
  }, [preferences, mergeIntoDeck]);

  const remainingJobs = useMemo(() => jobs.filter((j) => !reviewedJobIds.includes(j.id)), [jobs, reviewedJobIds]);

  // Continuously top up the deck when the user nears the end.
  useEffect(() => {
    if (mode !== 'jobs' || isFetchingJobs) return;
    if (remainingJobs.length > TOPUP_THRESHOLD || toppingUpRef.current) return;
    toppingUpRef.current = true;
    jobService.getMoreJobs(preferences)
      .then((more) => { mergeIntoDeck(more); })
      .catch(() => {})
      .finally(() => { toppingUpRef.current = false; });
  }, [remainingJobs.length, mode, isFetchingJobs, preferences, mergeIntoDeck]);
  const currentJob = remainingJobs[0] || null;
  const nextJob = remainingJobs[1] || null;

  const remainingProfiles = useMemo(
    () => NETWORK_PROFILES.filter((p) => !networkReviewedIds.includes(p.id)),
    [networkReviewedIds]
  );
  const currentProfile = remainingProfiles[0] || null;
  const nextProfile = remainingProfiles[1] || null;

  const activeCount = mode === 'jobs' ? jobs.length : NETWORK_PROFILES.length;
  const activeRemaining = mode === 'jobs' ? remainingJobs.length : remainingProfiles.length;

  // ─── Reset animation whenever the active card changes ────────────────────
  // Cancel any in-flight spring before reassigning — prevents Reanimated from
  // crashing on web when a spring is still running while we reset to 0.
  useEffect(() => {
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(isDragging);
    translateX.value = withTiming(0, { duration: 0 });
    translateY.value = withTiming(0, { duration: 0 });
    isDragging.value = withTiming(0, { duration: 0 });
  }, [currentJob?.id, currentProfile?.id]);

  // ─── AI: analyze the current card whenever it changes ────────────────────
  useEffect(() => {
    if (!currentJob) return;
    const jobId = currentJob.id;
    if (aiScores[jobId]) return; // already cached
    let active = true;
    setAnalyzingId(jobId);
    analyzeJobMatch(currentJob, resume)
      .then((result) => {
        if (!active) return;
        setAiScores((prev) => ({ ...prev, [jobId]: result }));
      })
      .catch(() => { /* ignore — score stays at fallback */ })
      .finally(() => {
        if (active) setAnalyzingId(null);
      });
    return () => { active = false; };
  }, [currentJob?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Swipe logic ──────────────────────────────────────────────────────────
  const resetCard = useCallback(() => {
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  }, []);

  const applyToJobAndNotify = useCallback(async (job: Job) => {
    setIsSubmitting(true);
    try {
      await jobService.recordSwipe(job.id, 'like');
      const app = await jobService.applyToJob(job, {
        id: user?.uid, name: user?.displayName, email: user?.email, phone: resume?.parsedData.phone,
      }, resume);
      setReviewedJobIds((ids) => [...new Set([...ids, job.id])]);
      setAppliedJobIds((ids) => [...new Set([...ids, job.id])]);
      const emailSent = Boolean(app.email?.sent);
      setStatusMessage(emailSent ? `Applied to ${job.company}. Confirmation email sent ✉️` : `Applied to ${job.company}.`);
      // Fire in-app notification
      addNotification({
        type: 'application',
        title: `Application submitted — ${job.title}`,
        body: `You applied to ${job.title} at ${job.company}. ${emailSent ? 'A confirmation email has been sent to you.' : 'Application queued.'}`,
        meta: {
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          applicationUrl: job.applicationUrl,
          emailSent,
        },
      });
    } catch {
      setReviewedJobIds((ids) => [...new Set([...ids, job.id])]);
      setAppliedJobIds((ids) => [...new Set([...ids, job.id])]);
      setStatusMessage(`Applied locally to ${job.company}.`);
      addNotification({
        type: 'application',
        title: `Application queued — ${job.title}`,
        body: `Application to ${job.title} at ${job.company} was queued locally.`,
        meta: { jobId: job.id, jobTitle: job.title, company: job.company, emailSent: false },
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, resume, addNotification]);

  const handleJobSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentJob || isSubmitting) return;
    if (direction === 'right') {
      // If AI Tailor is on and user has a resume, show tailor modal first
      if (aiTailorEnabled && resume) {
        setIsTailoring(true);
        try {
          const tailored = await tailorResumeForJob(currentJob, resume);
          setIsTailoring(false);
          setTailorModal({ job: currentJob, result: tailored });
        } catch {
          setIsTailoring(false);
          // Fallback: apply normally
          await applyToJobAndNotify(currentJob);
        }
      } else {
        await applyToJobAndNotify(currentJob);
      }
    } else {
      await jobService.recordSwipe(currentJob.id, 'dislike').catch(() => {});
      setReviewedJobIds((ids) => [...new Set([...ids, currentJob.id])]);
      setStatusMessage(`${currentJob.company} skipped.`);
    }
  }, [currentJob, isSubmitting, aiTailorEnabled, resume, applyToJobAndNotify]);

  const handleNetworkSwipe = useCallback((direction: 'left' | 'right') => {
    if (!currentProfile) return;
    setNetworkReviewedIds((ids) => [...new Set([...ids, currentProfile.id])]);
    if (direction === 'right') {
      addMatch(currentProfile);
      setStatusMessage(`Matched with ${currentProfile.name}! 🎉 Check your Matches tab.`);
    } else {
      setStatusMessage(`${currentProfile.name} skipped.`);
    }
  }, [currentProfile, addMatch]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (mode === 'jobs') handleJobSwipe(direction);
    else handleNetworkSwipe(direction);
  }, [mode, handleJobSwipe, handleNetworkSwipe]);

  const handleSave = useCallback(async () => {
    if (mode === 'networking') {
      if (!currentProfile) return;
      addMatch(currentProfile);
      setNetworkReviewedIds((ids) => [...new Set([...ids, currentProfile.id])]);
      setStatusMessage(`${currentProfile.name} saved to matches.`);
      resetCard();
      return;
    }
    if (!currentJob || isSubmitting) return;
    await jobService.saveJob(currentJob.id).catch(() => {});
    setReviewedJobIds((ids) => [...new Set([...ids, currentJob.id])]);
    setSavedJobIds((ids) => [...new Set([...ids, currentJob.id])]);
    setStatusMessage(`${currentJob.title} at ${currentJob.company} saved.`);
    resetCard();
  }, [mode, currentProfile, currentJob, isSubmitting, addMatch, resetCard]);

  const handleModeChange = (next: DeckMode) => {
    setMode(next);
    setStatusMessage(null);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(isDragging);
    translateX.value = withTiming(0, { duration: 0 });
    translateY.value = withTiming(0, { duration: 0 });
    isDragging.value = withTiming(0, { duration: 0 });
  };

  // ─── Gesture ─────────────────────────────────────────────────────────────
  // Memoized so the gesture object is stable across renders — recreating it
  // on every render causes instability on web (crash every ~2 min).
  // activeOffsetX / failOffsetY: only capture horizontal drags so vertical
  // scrolling on mobile/desktop is never blocked.
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-20, 20])
        .onBegin(() => {
          isDragging.value = withSpring(1, { damping: 20, stiffness: 300 });
        })
        .onUpdate((event) => {
          translateX.value = event.translationX;
          translateY.value = event.translationY * 0.4;
        })
        .onEnd((event) => {
          const shouldSwipe =
            Math.abs(event.translationX) > SWIPE_THRESHOLD ||
            Math.abs(event.velocityX) > 700;

          if (shouldSwipe) {
            const dir = event.translationX > 0 || event.velocityX > 0 ? 1 : -1;
            translateX.value = withSpring(dir * SCREEN_WIDTH * 1.6, {
              velocity: event.velocityX,
              damping: 18,
              stiffness: 110,
            });
            translateY.value = withSpring(translateY.value + event.velocityY * 0.1, {
              damping: 20,
              stiffness: 110,
            });
            isDragging.value = withTiming(0, { duration: 200 });
            runOnJS(handleSwipe)(dir > 0 ? 'right' : 'left');
          } else {
            translateX.value = withSpring(0, { damping: 22, stiffness: 220 });
            translateY.value = withSpring(0, { damping: 22, stiffness: 220 });
            isDragging.value = withTiming(0, { duration: 150 });
          }
        })
        .onFinalize(() => {
          // Safety reset — catches cancelled gestures (e.g. phone call interruption)
          isDragging.value = withTiming(0, { duration: 150 });
        }),
    // Re-create only when handleSwipe changes (i.e. mode or currentJob changes)
    [handleSwipe]
  );

  // ─── Animated styles ──────────────────────────────────────────────────────
  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, 0, SCREEN_WIDTH], [-18, 0, 18], Extrapolation.CLAMP);
    const scale = interpolate(isDragging.value, [0, 1], [1, 1.03], Extrapolation.CLAMP);
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }, { scale }],
    };
  });

  const applyLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SCREEN_WIDTH * 0.15], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [0, SCREEN_WIDTH * 0.2], [0.8, 1], Extrapolation.CLAMP) }],
  }));

  const skipLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SCREEN_WIDTH * 0.15, 0], [1, 0], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(translateX.value, [-SCREEN_WIDTH * 0.2, 0], [1, 0.8], Extrapolation.CLAMP) }],
  }));

  // ─── Renderers ────────────────────────────────────────────────────────────
  const formatSalary = (salary?: Job['salary']) => {
    if (!salary?.min || !salary?.max) return 'Compensation TBD';
    return `$${Math.round(salary.min / 1000)}k – $${Math.round(salary.max / 1000)}k`;
  };

  const renderJobCard = (job: Job, preview = false) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, height: preview ? CARD_HEIGHT : undefined, minHeight: CARD_HEIGHT }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.logoMark, { backgroundColor: `${theme.primary}18` }]}>
          <Text style={[styles.logoText, { color: theme.primary }]}>{(job.company || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.companyName, { color: theme.mutedForeground }]} numberOfLines={1}>{job.company}</Text>
          <Text style={[styles.jobTitle, { color: theme.foreground }]} numberOfLines={2}>{job.title}</Text>
        </View>
        {/* AI match score badge */}
        {aiScores[job.id] ? (
          <View style={[styles.scoreBadge, { backgroundColor: aiScores[job.id].recommendation === 'apply' ? `${theme.success}16` : `${theme.warning}16` }]}>
            <Ionicons name="sparkles" size={11} color={aiScores[job.id].recommendation === 'apply' ? theme.success : theme.warning} />
            <Text style={[styles.scoreText, { color: aiScores[job.id].recommendation === 'apply' ? theme.success : theme.warning }]}>
              {aiScores[job.id].score}%
            </Text>
          </View>
        ) : analyzingId === job.id ? (
          <View style={[styles.scoreBadge, { backgroundColor: `${theme.primary}12` }]}>
            <ActivityIndicator size="small" color={theme.primary} style={{ transform: [{ scale: 0.6 }] }} />
          </View>
        ) : (
          <View style={[styles.scoreBadge, { backgroundColor: `${theme.success}16` }]}>
            <Text style={[styles.scoreText, { color: theme.success }]}>{job.matchScore || 78}%</Text>
          </View>
        )}
      </View>

      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: theme.muted }]}>
          <Ionicons name="location-outline" size={13} color={theme.mutedForeground} />
          <Text style={[styles.pillText, { color: theme.foreground }]} numberOfLines={1}>{job.location}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: theme.muted }]}>
          <Ionicons name="cash-outline" size={13} color={theme.mutedForeground} />
          <Text style={[styles.pillText, { color: theme.foreground }]}>{formatSalary(job.salary)}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: theme.muted }]}>
          <Ionicons name={job.remote ? 'globe-outline' : 'business-outline'} size={13} color={theme.mutedForeground} />
          <Text style={[styles.pillText, { color: theme.foreground }]}>{job.workStyle || (job.remote ? 'Remote' : 'Hybrid')}</Text>
        </View>
      </View>

      <View style={[styles.summaryBox, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}22` }]}>
        <Text style={[styles.boxLabel, { color: theme.primary }]}>Quick summary</Text>
        <Text style={[styles.bodyText, { color: theme.foreground }]} numberOfLines={4}>
          {summarizeDescription(job.description, 220)}
        </Text>
        {!preview && (
          <TouchableOpacity onPress={() => setDetailJob(job)} style={styles.moreBtn} activeOpacity={0.75}>
            <Text style={[styles.moreBtnText, { color: theme.primary }]}>See full details</Text>
            <Ionicons name="chevron-forward" size={15} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>

      {!preview && (
        <>
          <View style={styles.reasonSection}>
            {aiScores[job.id] ? (
              <>
                <Text style={[styles.boxLabel, { color: theme.mutedForeground }]}>
                  AI analysis · {aiScores[job.id].grade} grade
                </Text>
                {aiScores[job.id].strengths.slice(0, 2).map((r) => (
                  <View key={r} style={styles.reasonRow}>
                    <Ionicons name="checkmark-circle" size={15} color={theme.success} />
                    <Text style={[styles.reasonText, { color: theme.foreground }]} numberOfLines={1}>{r}</Text>
                  </View>
                ))}
                {aiScores[job.id].gaps.slice(0, 1).map((g) => (
                  <View key={g} style={styles.reasonRow}>
                    <Ionicons name="alert-circle-outline" size={15} color={theme.warning} />
                    <Text style={[styles.reasonText, { color: theme.mutedForeground }]} numberOfLines={1}>{g}</Text>
                  </View>
                ))}
              </>
            ) : (
              <>
                <Text style={[styles.boxLabel, { color: theme.mutedForeground }]}>Why it matches</Text>
                {(job.whyMatch || ['Relevant role', 'Good culture fit']).slice(0, 3).map((r) => (
                  <View key={r} style={styles.reasonRow}>
                    <Ionicons name="checkmark-circle" size={15} color={theme.success} />
                    <Text style={[styles.reasonText, { color: theme.foreground }]} numberOfLines={1}>{r}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
          <View style={styles.tagRow}>
            {(job.requirements || []).slice(0, 4).map((s) => (
              <View key={s} style={[styles.tag, { backgroundColor: `${theme.secondary}14` }]}>
                <Text style={[styles.tagText, { color: theme.secondary }]}>{s}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );

  const renderNetworkCard = (profile: NetworkProfile, preview = false) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, minHeight: CARD_HEIGHT }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.netAvatar, { backgroundColor: `${theme.accent}18` }]}>
          <Text style={[styles.netAvatarText, { color: theme.accent }]}>{profile.avatar}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.companyName, { color: theme.mutedForeground }]}>{profile.title}</Text>
          <Text style={[styles.jobTitle, { color: theme.foreground }]}>{profile.name}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: `${theme.accent}16` }]}>
          <Text style={[styles.scoreText, { color: theme.accent }]}>{profile.matchScore}%</Text>
        </View>
      </View>

      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: theme.muted }]}>
          <Ionicons name="location-outline" size={13} color={theme.mutedForeground} />
          <Text style={[styles.pillText, { color: theme.foreground }]}>{profile.location}</Text>
        </View>
        <View style={[styles.pill, { backgroundColor: theme.muted }]}>
          <Ionicons name="business-outline" size={13} color={theme.mutedForeground} />
          <Text style={[styles.pillText, { color: theme.foreground }]}>{profile.company}</Text>
        </View>
      </View>

      <View style={[styles.summaryBox, { backgroundColor: `${theme.accent}08`, borderColor: `${theme.accent}22` }]}>
        <Text style={[styles.boxLabel, { color: theme.accent }]}>Looking for</Text>
        <Text style={[styles.lookingFor, { color: theme.foreground }]}>{profile.lookingFor}</Text>
        <Text style={[styles.bodyText, { color: theme.mutedForeground }]} numberOfLines={3}>{profile.bio}</Text>
        {!preview && (
          <TouchableOpacity onPress={() => setDetailProfile(profile)} style={styles.moreBtn} activeOpacity={0.75}>
            <Text style={[styles.moreBtnText, { color: theme.accent }]}>Full profile</Text>
            <Ionicons name="chevron-forward" size={15} color={theme.accent} />
          </TouchableOpacity>
        )}
      </View>

      {!preview && (
        <>
          <View style={styles.reasonSection}>
            <Text style={[styles.boxLabel, { color: theme.mutedForeground }]}>Project ideas</Text>
            {profile.projectIdeas.slice(0, 3).map((idea) => (
              <View key={idea} style={styles.reasonRow}>
                <Ionicons name="bulb-outline" size={15} color={theme.accent} />
                <Text style={[styles.reasonText, { color: theme.foreground }]} numberOfLines={1}>{idea}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tagRow}>
            {profile.skills.slice(0, 4).map((s) => (
              <View key={s} style={[styles.tag, { backgroundColor: `${theme.primary}12` }]}>
                <Text style={[styles.tagText, { color: theme.primary }]}>{s}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );

  const currentCard = mode === 'jobs' ? currentJob : currentProfile;
  const nextCard = mode === 'jobs' ? nextJob : nextProfile;
  const detailSections = detailJob ? detailSectionsForJob(detailJob) : null;

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenScrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
      {/* Mode toggle + filter button (captions removed) */}
      <View style={styles.toggleRow}>
        <View style={[styles.toggle, styles.toggleFlex, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['jobs', 'networking'] as DeckMode[]).map((item) => {
          const active = mode === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.toggleBtn, active && { backgroundColor: mode === 'networking' ? theme.accent : theme.primary }]}
              onPress={() => handleModeChange(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item === 'jobs' ? 'briefcase-outline' : 'git-network-outline'}
                size={16}
                color={active ? '#fff' : theme.mutedForeground}
              />
              <Text style={[styles.toggleText, { color: active ? '#fff' : theme.foreground }]}>
                {item === 'jobs' ? 'Jobs' : 'Networking'}
              </Text>
            </TouchableOpacity>
          );
        })}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('JobFilters')}
          activeOpacity={0.75}
        >
          <Ionicons name="options-outline" size={20} color={theme.foreground} />
        </TouchableOpacity>
      </View>

      {/* Minimal action counts — no deck counter */}
      {(appliedJobIds.length > 0 || savedJobIds.length > 0) && mode === 'jobs' && (
        <View style={styles.statsRow}>
          {appliedJobIds.length > 0 && (
            <View style={[styles.statPill, { backgroundColor: `${theme.success}12` }]}>
              <Ionicons name="send-outline" size={13} color={theme.success} />
              <Text style={[styles.statValue, { color: theme.success }]}>{appliedJobIds.length} applied</Text>
            </View>
          )}
          {savedJobIds.length > 0 && (
            <View style={[styles.statPill, { backgroundColor: `${theme.secondary}12` }]}>
              <Ionicons name="bookmark-outline" size={13} color={theme.secondary} />
              <Text style={[styles.statValue, { color: theme.secondary }]}>{savedJobIds.length} saved</Text>
            </View>
          )}
        </View>
      )}

      {/* Status banner */}
      {statusMessage && (
        <View style={[styles.statusBanner, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}44` }]}>
          <Ionicons name="checkmark-circle" size={17} color={theme.success} />
          <Text style={[styles.statusText, { color: theme.foreground }]}>{statusMessage}</Text>
        </View>
      )}

      {/* Deck */}
      <View style={styles.deck}>
        {(isFetchingJobs && mode === 'jobs') || isSubmitting ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
              {isFetchingJobs ? 'Fetching live jobs…' : 'Submitting application…'}
            </Text>
            {isFetchingJobs && (
              <Text style={[styles.loadingSubText, { color: theme.mutedForeground }]}>
                Scanning Greenhouse, Ashby, Lever and more
              </Text>
            )}
          </View>
        ) : currentCard ? (
          <View style={styles.stage}>
            {/* Next card (behind) */}
            {nextCard && (
              <View style={styles.behindCard}>
                {mode === 'jobs' && nextJob ? renderJobCard(nextJob, true) : nextProfile ? renderNetworkCard(nextProfile, true) : null}
              </View>
            )}
            {/* Active card */}
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.frontCard, cardStyle]}>
                {/* Swipe labels */}
                <Animated.View style={[styles.swipeLabel, styles.applyLabel, applyLabelStyle, mode === 'networking' && { borderColor: theme.accent }]}>
                  <Text style={[styles.swipeLabelText, { color: mode === 'jobs' ? theme.success : theme.accent }]}>
                    {mode === 'jobs' ? 'APPLY' : 'CONNECT'}
                  </Text>
                </Animated.View>
                <Animated.View style={[styles.swipeLabel, styles.skipLabel, skipLabelStyle]}>
                  <Text style={[styles.swipeLabelText, { color: theme.destructive }]}>SKIP</Text>
                </Animated.View>
                {mode === 'jobs' && currentJob
                  ? renderJobCard(currentJob)
                  : currentProfile
                  ? renderNetworkCard(currentProfile)
                  : null}
              </Animated.View>
            </GestureDetector>
          </View>
        ) : (
          <View style={styles.center}>
            <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}12` }]}>
              <Ionicons name="checkmark-done-outline" size={42} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              {mode === 'jobs' ? 'All caught up' : 'Network fully explored'}
            </Text>
            <Text style={[styles.emptySub, { color: theme.mutedForeground }]}>
              {mode === 'jobs'
                ? 'You reviewed every live role in this session. Pull-to-refresh or adjust your preferences for fresh jobs.'
                : 'You reviewed all networking profiles. Check back soon for new people to connect with.'}
            </Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      {currentCard && !isSubmitting && (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, { borderColor: theme.destructive, backgroundColor: theme.card }]}
            onPress={() => {
              cancelAnimation(translateX);
              translateX.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 18, stiffness: 110 });
              handleSwipe('left');
            }}
          >
            <Ionicons name="close" size={28} color={theme.destructive} />
          </Pressable>
          <Pressable
            style={[styles.saveBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
            onPress={handleSave}
          >
            <Ionicons name="bookmark-outline" size={23} color={theme.foreground} />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { borderColor: mode === 'networking' ? theme.accent : theme.success, backgroundColor: mode === 'networking' ? `${theme.accent}14` : `${theme.success}12` }]}
            onPress={() => {
              cancelAnimation(translateX);
              translateX.value = withSpring(SCREEN_WIDTH * 1.5, { damping: 18, stiffness: 110 });
              handleSwipe('right');
            }}
          >
            <Ionicons name={mode === 'jobs' ? 'send' : 'git-network-outline'} size={25} color={mode === 'networking' ? theme.accent : theme.success} />
          </Pressable>
        </View>
      )}
      </ScrollView>

      {/* Job detail modal */}
      <Modal visible={Boolean(detailJob)} animationType="slide" transparent onRequestClose={() => setDetailJob(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHead}>
              <View style={styles.modalHeadText}>
                <Text style={[styles.companyName, { color: theme.mutedForeground }]}>{detailJob?.company}</Text>
                <Text style={[styles.modalTitle, { color: theme.foreground }]}>{detailJob?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailJob(null)} style={[styles.closeBtn, { backgroundColor: theme.muted }]}>
                <Ionicons name="close" size={20} color={theme.foreground} />
              </TouchableOpacity>
            </View>
            {detailSections && (
              <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: Spacing['3xl'] }}>
                {[
                  { title: 'Overview', content: detailSections.overview },
                ].map(({ title, content }) => (
                  <View key={title}>
                    <Text style={[styles.detailSection, { color: theme.primary }]}>{title}</Text>
                    <Text style={[styles.detailBody, { color: theme.foreground }]}>{content}</Text>
                  </View>
                ))}
                <Text style={[styles.detailSection, { color: theme.primary }]}>Responsibilities</Text>
                {detailSections.responsibilities.map((r) => (
                  <Text key={r} style={[styles.detailBullet, { color: theme.foreground }]}>• {r}</Text>
                ))}
                <Text style={[styles.detailSection, { color: theme.primary }]}>Requirements</Text>
                {detailSections.requirements.map((r) => (
                  <Text key={r} style={[styles.detailBullet, { color: theme.foreground }]}>• {r}</Text>
                ))}
                <Text style={[styles.detailSection, { color: theme.primary }]}>Benefits</Text>
                {detailSections.benefits.map((b) => (
                  <Text key={b} style={[styles.detailBullet, { color: theme.foreground }]}>• {b}</Text>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* AI Tailoring loading overlay */}
      <Modal visible={isTailoring} transparent animationType="fade">
        <View style={styles.tailorOverlay}>
          <View style={[styles.tailorBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.tailorTitle, { color: theme.foreground }]}>AI is tailoring your resume</Text>
            <Text style={[styles.tailorSub, { color: theme.mutedForeground }]}>
              Matching your experience to this role…
            </Text>
          </View>
        </View>
      </Modal>

      {/* AI Tailor review modal */}
      <Modal visible={Boolean(tailorModal)} animationType="slide" transparent onRequestClose={() => setTailorModal(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHandle} />
            <View style={styles.tailorHeader}>
              <View style={[styles.tailorIconBadge, { backgroundColor: `${theme.primary}15` }]}>
                <Ionicons name="sparkles" size={22} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.tailorTitle, { color: theme.foreground, marginTop: 0 }]}>
                  Resume tailored to {tailorModal?.result.newScore}% match
                </Text>
                <Text style={[styles.tailorSub, { color: theme.mutedForeground }]}>{tailorModal?.result.summary}</Text>
              </View>
              <TouchableOpacity onPress={() => setTailorModal(null)} style={[styles.closeBtn, { backgroundColor: theme.muted }]}>
                <Ionicons name="close" size={18} color={theme.foreground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: Spacing['3xl'] }}>
              {tailorModal?.result.changes.slice(0, 5).map((c, i) => (
                <View key={i} style={[styles.changeCard, { borderColor: theme.border }]}>
                  <Text style={[styles.changeSection, { color: theme.primary }]}>{c.section}</Text>
                  <Text style={[styles.changeOld, { color: theme.mutedForeground }]} numberOfLines={2}>Before: {c.original}</Text>
                  <Text style={[styles.changeNew, { color: theme.success }]} numberOfLines={2}>After: {c.improved}</Text>
                </View>
              ))}
              <View style={[styles.tailoredPreview, { backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}22` }]}>
                <Text style={[styles.boxLabel, { color: theme.primary }]}>Tailored resume preview</Text>
                <Text style={[styles.bodyText, { color: theme.foreground }]} numberOfLines={8}>
                  {tailorModal?.result.tailoredText}
                </Text>
              </View>
            </ScrollView>
            {/* Confirm / Skip buttons */}
            <View style={styles.tailorActions}>
              <TouchableOpacity
                style={[styles.tailorSkipBtn, { borderColor: theme.border }]}
                onPress={() => setTailorModal(null)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tailorSkipText, { color: theme.mutedForeground }]}>Skip & Apply Original</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tailorConfirmBtn, { backgroundColor: theme.primary }]}
                onPress={async () => {
                  const job = tailorModal!.job;
                  setTailorModal(null);
                  await applyToJobAndNotify(job);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.tailorConfirmText}>Apply with Tailored Resume</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Network profile modal */}
      <Modal visible={Boolean(detailProfile)} animationType="slide" transparent onRequestClose={() => setDetailProfile(null)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHandle} />
            {detailProfile && (
              <>
                <View style={styles.modalHead}>
                  <View style={[styles.netAvatarLg, { backgroundColor: `${theme.accent}20` }]}>
                    <Text style={[styles.netAvatarLgText, { color: theme.accent }]}>{detailProfile.avatar}</Text>
                  </View>
                  <View style={styles.modalHeadText}>
                    <Text style={[styles.jobTitle, { color: theme.foreground }]}>{detailProfile.name}</Text>
                    <Text style={[styles.companyName, { color: theme.mutedForeground }]}>{detailProfile.title} · {detailProfile.company}</Text>
                    <Text style={[styles.companyName, { color: theme.mutedForeground }]}>{detailProfile.location}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailProfile(null)} style={[styles.closeBtn, { backgroundColor: theme.muted }]}>
                    <Ionicons name="close" size={20} color={theme.foreground} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: Spacing['3xl'] }}>
                  <Text style={[styles.detailSection, { color: theme.accent }]}>About</Text>
                  <Text style={[styles.detailBody, { color: theme.foreground }]}>{detailProfile.bio}</Text>
                  <Text style={[styles.detailSection, { color: theme.accent }]}>Looking For</Text>
                  <Text style={[styles.detailBody, { color: theme.foreground }]}>{detailProfile.lookingFor}</Text>
                  <Text style={[styles.detailSection, { color: theme.accent }]}>Experience</Text>
                  <Text style={[styles.detailBody, { color: theme.foreground }]}>{detailProfile.experience}</Text>
                  <Text style={[styles.detailSection, { color: theme.accent }]}>Interests</Text>
                  <View style={styles.tagRow}>
                    {detailProfile.interests.map((i) => (
                      <View key={i} style={[styles.tag, { backgroundColor: `${theme.accent}14` }]}>
                        <Text style={[styles.tagText, { color: theme.accent }]}>{i}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[styles.detailSection, { color: theme.accent }]}>Skills</Text>
                  <View style={styles.tagRow}>
                    {detailProfile.skills.map((s) => (
                      <View key={s} style={[styles.tag, { backgroundColor: `${theme.primary}12` }]}>
                        <Text style={[styles.tagText, { color: theme.primary }]}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenScroll: { flex: 1 },
  screenScrollContent: { flexGrow: 1, paddingBottom: 128 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  kicker: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 2 },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold },
  filterBtn: { width: 44, height: 44, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: BorderRadius.full, padding: 4, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  toggleFlex: { flex: 1, marginHorizontal: 0, marginBottom: 0 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full, paddingVertical: Spacing.sm, gap: Spacing.xs },
  toggleText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, borderRadius: BorderRadius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  statValue: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.lg, gap: Spacing.sm, marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  statusText: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  deck: { paddingHorizontal: Spacing.xl, minHeight: CARD_HEIGHT + 34 },
  stage: { minHeight: CARD_HEIGHT + 34, justifyContent: 'center' },
  behindCard: { position: 'absolute', left: 8, right: 8, top: 20, opacity: 0.42, transform: [{ scale: 0.96 }] },
  frontCard: { width: '100%' },
  card: { borderWidth: 1, borderRadius: BorderRadius['2xl'], padding: Spacing.xl, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  logoMark: { width: 50, height: 50, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0 },
  logoText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  netAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0 },
  netAvatarText: { fontSize: FontSize.md, fontWeight: FontWeight.extrabold },
  netAvatarLg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, flexShrink: 0 },
  netAvatarLgText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  cardMeta: { flex: 1, paddingRight: Spacing.sm },
  companyName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 3 },
  jobTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, lineHeight: 26 },
  scoreBadge: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  scoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  pill: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 5, gap: 4 },
  pillText: { fontSize: 12, fontWeight: FontWeight.medium },
  summaryBox: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.md },
  boxLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, marginBottom: Spacing.xs },
  bodyText: { fontSize: FontSize.sm, lineHeight: 20 },
  lookingFor: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: Spacing.xs, lineHeight: 22 },
  moreBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 2, marginTop: Spacing.sm },
  moreBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  reasonSection: { marginBottom: Spacing.md, gap: Spacing.xs },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  reasonText: { flex: 1, fontSize: FontSize.sm, lineHeight: 19 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tag: { borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 5 },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  swipeLabel: { position: 'absolute', top: 24, zIndex: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 3, borderRadius: BorderRadius.lg, backgroundColor: 'rgba(255,255,255,0.94)' },
  applyLabel: { right: 20, borderColor: '#10B981' },
  skipLabel: { left: 20, borderColor: '#EF4444' },
  swipeLabelText: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, letterSpacing: 1 },
  center: { minHeight: CARD_HEIGHT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing['2xl'] },
  loadingText: { fontSize: FontSize.md, marginTop: Spacing.md },
  loadingSubText: { fontSize: FontSize.sm, marginTop: Spacing.sm, opacity: 0.7 },
  emptyIcon: { width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.extrabold, marginBottom: Spacing.sm },
  emptySub: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22 },
  actions: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xl, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  actionBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  saveBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '85%', borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing.xl },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: Spacing.lg },
  modalHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  modalHeadText: { flex: 1, paddingRight: Spacing.md },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, lineHeight: 26 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  detailSection: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  detailBody: { fontSize: FontSize.md, lineHeight: 24 },
  detailBullet: { fontSize: FontSize.md, lineHeight: 24, marginBottom: Spacing.xs },
  // AI tailor
  tailorOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing['3xl'] },
  tailorBox: { borderRadius: BorderRadius['2xl'], borderWidth: 1, padding: Spacing['3xl'], alignItems: 'center', gap: Spacing.md, width: '100%' },
  tailorHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.lg },
  tailorIconBadge: { width: 48, height: 48, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tailorTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginTop: Spacing.md },
  tailorSub: { fontSize: FontSize.sm, lineHeight: 20, marginTop: 4 },
  changeCard: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.md },
  changeSection: { fontSize: FontSize.xs, fontWeight: FontWeight.extrabold, marginBottom: Spacing.xs },
  changeOld: { fontSize: FontSize.sm, lineHeight: 18, marginBottom: Spacing.xs },
  changeNew: { fontSize: FontSize.sm, lineHeight: 18 },
  tailoredPreview: { borderWidth: 1, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginTop: Spacing.md },
  tailorActions: { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.lg },
  tailorSkipBtn: { flex: 1, height: 48, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tailorSkipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  tailorConfirmBtn: { flex: 2, height: 48, borderRadius: BorderRadius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  tailorConfirmText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});

export default JobSwipeScreen;
