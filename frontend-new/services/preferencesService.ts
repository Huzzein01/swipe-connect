import { UserPreferences } from '../types/job';
import { db } from '../config/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export const preferencesService = {
  // Save user preferences
  savePreferences: async (userId: string, preferences: UserPreferences): Promise<void> => {
    const preferencesRef = doc(db, 'preferences', userId);
    await setDoc(preferencesRef, {
      ...preferences,
      lastUpdated: new Date().toISOString(),
    });
  },

  // Get user preferences
  getPreferences: async (userId: string): Promise<UserPreferences | null> => {
    const preferencesRef = doc(db, 'preferences', userId);
    const preferencesDoc = await getDoc(preferencesRef);

    if (!preferencesDoc.exists()) {
      return null;
    }

    return preferencesDoc.data() as UserPreferences;
  },

  // Update user preferences
  updatePreferences: async (userId: string, updates: Partial<UserPreferences>): Promise<void> => {
    const preferencesRef = doc(db, 'preferences', userId);
    await updateDoc(preferencesRef, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });
  },

  // Set default preferences based on resume
  setDefaultPreferences: async (userId: string, resume: any): Promise<void> => {
    const defaultPreferences: UserPreferences = {
      industries: [resume.parsedData.experience[0]?.company || ''],
      jobTypes: ['full-time'],
      location: {
        city: resume.parsedData.location.city,
        state: resume.parsedData.location.state,
        radius: 50,
      },
      remote: true,
      experienceLevel: 'mid',
    };

    await preferencesService.savePreferences(userId, defaultPreferences);
  },

  // Update location preferences
  updateLocationPreferences: async (
    userId: string,
    location: { city: string; state: string; radius: number }
  ): Promise<void> => {
    const preferencesRef = doc(db, 'preferences', userId);
    await updateDoc(preferencesRef, {
      location,
      lastUpdated: new Date().toISOString(),
    });
  },

  // Update industry preferences
  updateIndustryPreferences: async (userId: string, industries: string[]): Promise<void> => {
    const preferencesRef = doc(db, 'preferences', userId);
    await updateDoc(preferencesRef, {
      industries,
      lastUpdated: new Date().toISOString(),
    });
  },

  // Update job type preferences
  updateJobTypePreferences: async (
    userId: string,
    jobTypes: ('full-time' | 'part-time' | 'contract' | 'internship')[]
  ): Promise<void> => {
    const preferencesRef = doc(db, 'preferences', userId);
    await updateDoc(preferencesRef, {
      jobTypes,
      lastUpdated: new Date().toISOString(),
    });
  },
}; 