import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type JobSwipeScreenProps = {
  navigation: any;
};

const JobSwipeScreen = ({ navigation }: JobSwipeScreenProps) => {
  const { isDark } = useTheme();
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
          event.translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH
        );
        runOnJS(handleSwipe)(event.translationX > 0 ? 'right' : 'left');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = translateX.value / SCREEN_WIDTH * 30;
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (!currentJob) return;

    if (direction === 'right') {
      setIsLoading(true);
      try {
        await applyForJob(currentJob);
        Alert.alert('Success', 'Application submitted successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to submit application. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    translateX.value = 0;
    translateY.value = 0;
    loadNextJob();
  };

  const applyForJob = async (job: Job) => {
    // TODO: Implement AI job application logic
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const loadNextJob = () => {
    // TODO: Implement job loading logic
    setCurrentJob({
      id: '1',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      description: 'We are looking for a software engineer...',
      requirements: ['React', 'TypeScript', 'Node.js'],
      type: 'full-time',
      industry: 'Technology',
      postedDate: new Date().toISOString(),
      remote: true,
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate('JobFilters')}
        >
          <Text style={[styles.filterButtonText, isDark && styles.textDark]}>
            Filters
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f4511e" />
            <Text style={[styles.loadingText, isDark && styles.textDark]}>
              Submitting Application...
            </Text>
          </View>
        ) : currentJob ? (
          <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.card, animatedStyle]}>
              <Image
                source={{ uri: currentJob.companyLogo || 'https://via.placeholder.com/150' }}
                style={styles.companyLogo}
              />
              <Text style={[styles.jobTitle, isDark && styles.textDark]}>
                {currentJob.title}
              </Text>
              <Text style={[styles.companyName, isDark && styles.textDark]}>
                {currentJob.company}
              </Text>
              <Text style={[styles.location, isDark && styles.textDark]}>
                {currentJob.location}
              </Text>
              <Text style={[styles.description, isDark && styles.textDark]}>
                {currentJob.description}
              </Text>
              <View style={styles.requirements}>
                {currentJob.requirements.map((req, index) => (
                  <View
                    key={index}
                    style={[styles.requirementTag, isDark && styles.requirementTagDark]}
                  >
                    <Text style={[styles.requirementText, isDark && styles.textDark]}>
                      {req}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </PanGestureHandler>
        ) : (
          <View style={styles.noJobsContainer}>
            <Text style={[styles.noJobsText, isDark && styles.textDark]}>
              No more jobs to show
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={() => handleSwipe('left')}
        >
          <Text style={styles.actionButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.applyButton]}
          onPress={() => handleSwipe('right')}
        >
          <Text style={styles.actionButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  filterButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f4511e',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyName: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
  },
  requirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  requirementTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  requirementTagDark: {
    backgroundColor: '#333',
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    padding: 15,
    borderRadius: 30,
    width: 120,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#ff4444',
  },
  applyButton: {
    backgroundColor: '#00C851',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  noJobsContainer: {
    alignItems: 'center',
  },
  noJobsText: {
    fontSize: 18,
    color: '#666',
  },
  textDark: {
    color: '#fff',
  },
});

export default JobSwipeScreen; 