/**
 * UserProfileContext
 * Single profile that serves both job applications and professional networking.
 * Persisted to AsyncStorage. Photo stored as base64 or URL string.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type WorkStyle = 'Remote' | 'Hybrid' | 'On-site' | 'Flexible';
export type OpenTo = 'Mentoring' | 'Co-founding' | 'Freelance' | 'Advisory' | 'Side project' | 'Full-time roles' | 'Networking';

export type UserProfile = {
  // ── Identity
  displayName: string;
  title: string;            // e.g. "Senior Product Manager"
  photoUri: string;         // base64 data URI or remote URL
  email: string;
  phone: string;
  location: string;         // "Chicago, IL"
  bio: string;

  // ── Professional
  currentCompany: string;
  experienceYears: string;  // "3-5 years"
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;

  // ── Skills & Interests
  skills: string[];
  industries: string[];

  // ── Job Search
  targetRoles: string[];
  workStyle: WorkStyle[];
  salaryMin: string;
  salaryMax: string;
  openToRoles: string;      // free text, e.g. "PM, Product Lead"

  // ── Networking
  networkingGoals: string;  // "Looking for technical co-founder"
  projectIdeas: string[];
  openTo: OpenTo[];
  startupInterests: string[];
};

const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  title: '',
  photoUri: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  currentCompany: '',
  experienceYears: '3-5 years',
  linkedinUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  skills: [],
  industries: [],
  targetRoles: [],
  workStyle: ['Remote'],
  salaryMin: '',
  salaryMax: '',
  openToRoles: '',
  networkingGoals: '',
  projectIdeas: [],
  openTo: ['Full-time roles', 'Networking'],
  startupInterests: [],
};

type UserProfileContextType = {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  resetProfile: () => Promise<void>;
  profileCompletion: number; // 0-100
};

const STORAGE_KEY = 'swipeconnect.userProfile';
const Ctx = createContext<UserProfileContextType>({} as UserProfileContextType);
export const useUserProfile = () => useContext(Ctx);

const calcCompletion = (p: UserProfile): number => {
  const fields: Array<keyof UserProfile> = [
    'displayName', 'title', 'photoUri', 'bio', 'location',
    'currentCompany', 'linkedinUrl', 'skills', 'industries',
    'targetRoles', 'networkingGoals',
  ];
  const filled = fields.filter((f) => {
    const v = p[f];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
  return Math.round((filled.length / fields.length) * 100);
};

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) try { setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) }); } catch { /* ignore */ }
    });
  }, []);

  const save = async (next: UserProfile) => {
    setProfile(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateProfile = async (patch: Partial<UserProfile>) => save({ ...profile, ...patch });
  const resetProfile = async () => save(DEFAULT_PROFILE);

  return (
    <Ctx.Provider value={{ profile, updateProfile, resetProfile, profileCompletion: calcCompletion(profile) }}>
      {children}
    </Ctx.Provider>
  );
};
