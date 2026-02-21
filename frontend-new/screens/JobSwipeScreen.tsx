import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Job } from '../types/job';
import { useAuth } from '../contexts/AuthContext';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type JobSwipeScreenProps = {
  navigation: any;
};

const JobSwipeScreen = ({ navigation }: JobSwipeScreenProps) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    loadNextJob();
  }, []);

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
      [-25, 0, 25],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SCREEN_WIDTH * 0.3], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SCREEN_WIDTH * 0.3, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentJob) return;
    if (direction === 'right') {
      setIsLoading(true);
      try {
        await applyForJob(currentJob);
        Alert.alert('Applied!', `You applied to ${currentJob.title} at ${currentJob.company}`);
      } catch (error) {
        Alert.alert('Error', 'Failed to submit application.');
      } finally {
        setIsLoading(false);
      }
    }
    translateX.value = 0;
    translateY.value = 0;
    loadNextJob();
  };

  const applyForJob = async (_job: Job) => {
    return new Promise((resolve) => setTimeout(resolve, 800));
  };

  const loadNextJob = () => {
    setCurrentJob({
      id: '1',
      title: 'Senior Product Manager',
      company: 'TechStartup Inc.',
      location: 'San Francisco, CA',
      description: 'We are looking for a passionate product manager to lead our core product initiatives and drive innovation across the platform.',
      requirements: ['React', 'TypeScript', 'Node.js', 'Product Strategy'],
      type: 'full-time',
      industry: 'Technology',
      postedDate: new Date().toISOString(),
      remote: true,
      salary: { min: 150000, max: 180000, currency: 'USD' },
    });
  };

  const formatSalary = (salary?: Job['salary']) => {
    if (!salary) return null;
    const fmt = (n: number) => `$${Math.round(n / 1000)}k`;
    return `${fmt(salary.min)} - ${fmt(salary.max)}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>Discover</Text>
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}30` }]}
          onPress={() => navigation.navigate('JobFilters')}
        >
          <Ionicons name="options-outline" size={16} color={theme.primary} />
          <Text style={[styles.filterChipText, { color: theme.primary }]}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Card Area */}
      <View style={styles.cardContainer}>
        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.mutedForeground }]}>
              Submitting Application...
            </Text>
          </View>
        ) : currentJob ? (
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.card, cardStyle, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {/* Swipe Labels */}
              <Animated.View style={[styles.swipeLabel, styles.likeLabel, likeOpacity]}>
                <Text style={[styles.swipeLabelText, { color: theme.success }]}>APPLY</Text>
              </Animated.View>
              <Animated.View style={[styles.swipeLabel, styles.nopeLabel, nopeOpacity]}>
                <Text style={[styles.swipeLabelText, { color: theme.destructive }]}>SKIP</Text>
              </Animated.View>

              {/* Company Icon */}
              <View style={[styles.companyIconBox, { backgroundColor: `${theme.secondary}15` }]}>
                <Ionicons name="business" size={32} color={theme.secondary} />
              </View>

              <Text style={[styles.jobTitle, { color: theme.foreground }]}>
                {currentJob.title}
              </Text>
              <Text style={[styles.companyName, { color: theme.mutedForeground }]}>
                {currentJob.company}
              </Text>

              {/* Tags */}
              <View style={styles.tagsRow}>
                {currentJob.remote && (
                  <View style={[styles.tag, { backgroundColor: `${theme.accent}15` }]}>
                    <Text style={[styles.tagText, { color: theme.accent }]}>Remote</Text>
                  </View>
                )}
                {currentJob.salary && (
                  <View style={[styles.tag, { backgroundColor: `${theme.primary}15` }]}>
                    <Text style={[styles.tagText, { color: theme.primary }]}>
                      {formatSalary(currentJob.salary)}
                    </Text>
                  </View>
                )}
                <View style={[styles.tag, { backgroundColor: `${theme.secondary}15` }]}>
                  <Text style={[styles.tagText, { color: theme.secondary }]}>
                    {currentJob.type}
                  </Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={theme.mutedForeground} />
                <Text style={[styles.locationText, { color: theme.mutedForeground }]}>
                  {currentJob.location}
                </Text>
              </View>

              {/* Description */}
              <Text style={[styles.description, { color: theme.foreground }]} numberOfLines={3}>
                {currentJob.description}
              </Text>

              {/* Skills */}
              <View style={styles.skillsRow}>
                {currentJob.requirements.map((req, index) => (
                  <View key={index} style={[styles.skillTag, { backgroundColor: theme.muted }]}>
                    <Text style={[styles.skillTagText, { color: theme.foreground }]}>{req}</Text>
                  </View>
                ))}
              </View>

              {/* Footer hint */}
              <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                <Text style={[styles.swipeHint, { color: theme.mutedForeground }]}>
                  Swipe to match
                </Text>
              </View>
            </Animated.View>
          </PanGestureHandler>
        ) : (
          <View style={styles.centerContent}>
            <Ionicons name="briefcase-outline" size={64} color={theme.muted} />
            <Text style={[styles.emptyTitle, { color: theme.foreground }]}>
              No more jobs
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.mutedForeground }]}>
              Check back later for new opportunities
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.skipBtn, { borderColor: theme.destructive }]}
          onPress={() => handleSwipe('left')}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={theme.destructive} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.applyBtn, { borderColor: theme.accent, backgroundColor: `${theme.accent}10` }]}
          onPress={() => handleSwipe('right')}
          activeOpacity={0.7}
        >
          <Ionicons name="heart" size={28} color={theme.accent} />
        </TouchableOpacity>
      </View>
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
    paddingVertical: Spacing.lg,
  },
  headerTitle: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: Spacing['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  swipeLabel: {
    position: 'absolute',
    top: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: BorderRadius.lg,
  },
  likeLabel: { right: 24, borderColor: '#10B981' },
  nopeLabel: { left: 24, borderColor: '#EF4444' },
  swipeLabelText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, letterSpacing: 2 },
  companyIconBox: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  jobTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: Spacing.xs },
  companyName: { fontSize: FontSize.md, marginBottom: Spacing.md },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  tagText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  locationText: { fontSize: FontSize.sm },
  description: { fontSize: FontSize.md, lineHeight: 24, marginBottom: Spacing.lg },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  skillTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  skillTagText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium },
  cardFooter: { borderTopWidth: 1, paddingTop: Spacing.lg },
  swipeHint: { fontSize: FontSize.xs, textAlign: 'center' },
  centerContent: { alignItems: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  emptySubtitle: { fontSize: FontSize.md },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing['3xl'],
    paddingVertical: Spacing.xl,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {},
  applyBtn: {},
});

export default JobSwipeScreen;
