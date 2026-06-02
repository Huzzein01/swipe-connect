/**
 * UserProfileContext
 * Single profile that serves both job applications and professional networking.
 * Persisted to AsyncStorage. Photo stored as base64 or URL string.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

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
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) try { setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) }); } catch { /* ignore */ }
      setHydrated(true);
    });
  }, []);

  const save = async (next: UserProfile) => {
    setProfile(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const updateProfile = async (patch: Partial<UserProfile>) => save({ ...profileRef.current, ...patch });
  const resetProfile = async () => save(DEFAULT_PROFILE);

  // ── Sync LinkedIn sign-in data into the profile (fills empty fields only) ──
  useEffect(() => {
    if (!hydrated || !user || user.provider !== 'linkedin') return;
    if (syncedFor.current === user.uid) return; // sync once per LinkedIn user
    syncedFor.current = user.uid;

    const p = profileRef.current;
    const li = user.linkedin || {};
    const patch: Partial<UserProfile> = {};

    if (!p.displayName && user.displayName) patch.displayName = user.displayName;
    if (!p.email && user.email) patch.email = user.email;
    // Photo: always adopt the LinkedIn avatar if the profile has none
    if (!p.photoUri && user.photoURL) patch.photoUri = user.photoURL;
    if (!p.title && li.headline) patch.title = li.headline;
    if (!p.bio && li.bio) patch.bio = li.bio;
    if (!p.location && li.location) patch.location = li.location;
    if (!p.currentCompany && li.company) patch.currentCompany = li.company;
    if (!p.linkedinUrl && li.linkedinUrl) patch.linkedinUrl = li.linkedinUrl;

    if (Object.keys(patch).length > 0) {
      save({ ...p, ...patch });
    }
  }, [hydrated, user?.uid, user?.provider]);

  return (
    <Ctx.Provider value={{ profile, updateProfile, resetProfile, profileCompletion: calcCompletion(profile) }}>
      {children}
    </Ctx.Provider>
  );
};
