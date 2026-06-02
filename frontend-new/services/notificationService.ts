import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

const requireDb = () => {
  if (!db) {
    throw new Error('Firebase database is not configured. Notification history is stored locally in demo mode.');
  }
  return db;
};

export const notificationService = {
  // Request notification permissions
  requestPermissions: async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  // Schedule job alert notification
  scheduleJobAlert: async (userId: string, jobId: string, jobTitle: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Job Match!',
        body: `We found a perfect match for you: ${jobTitle}`,
        data: { jobId },
      },
      trigger: null,
    });
  },

  // Schedule application status update
  scheduleStatusUpdate: async (userId: string, applicationId: string, status: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Application Update',
        body: `Your application status has been updated to: ${status}`,
        data: { applicationId },
      },
      trigger: null,
    });
  },

  // Save notification preferences
  saveNotificationPreferences: async (userId: string, preferences: {
    jobAlerts: boolean;
    applicationUpdates: boolean;
    newMatches: boolean;
    emailNotifications: boolean;
  }) => {
    const database = requireDb();
    const notificationsRef = collection(database, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      ...preferences,
      createdAt: new Date().toISOString(),
    });
  },

  // Get user's notification history
  getNotificationHistory: async (userId: string) => {
    const database = requireDb();
    const notificationsRef = collection(database, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};
