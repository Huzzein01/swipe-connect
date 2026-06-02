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
  experienceYears: '',
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

// Fields that MUST be strings (rendering a non-string as a React child crashes the app)
const STRING_FIELDS: (keyof UserProfile)[] = [
  'displayName', 'title', 'photoUri', 'email', 'phone', 'location', 'bio',
  'currentCompany', 'experienceYears', 'linkedinUrl', 'githubUrl', 'portfolioUrl',
  'salaryMin', 'salaryMax', 'openToRoles', 'networkingGoals',
];
const ARRAY_FIELDS: (keyof UserProfile)[] = [
  'skills', 'industries', 'targetRoles', 'workStyle', 'projectIdeas', 'openTo', 'startupInterests',
];

const toStr = (v: any): string => {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  if (typeof v === 'object') return String(v.name ?? v.value ?? v.label ?? '');
  return String(v);
};

/** Repair any corrupted stored/incoming profile so every field has its expected type. */
const sanitizeProfile = (raw: any): UserProfile => {
  const p: any = { ...DEFAULT_PROFILE, ...(raw && typeof raw === 'object' ? raw : {}) };
  STRING_FIELDS.forEach((f) => { p[f] = toStr(p[f]); });
  ARRAY_FIELDS.forEach((f) => {
    p[f] = Array.isArray(p[f]) ? p[f].map(toStr).filter(Boolean) : [];
  });
  return p as UserProfile;
};

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
      if (raw) {
        try {
          const loaded = sanitizeProfile(JSON.parse(raw));
          setProfile(loaded);
          // Re-persist the repaired version so corrupted data is fixed permanently
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
        } catch { /* ignore */ }
      }
      setHydrated(true);
    });
  }, []);

  const save = async (next: UserProfile) => {
    const clean = sanitizeProfile(next);
    setProfile(clean);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  };

  const updateProfile = async (patch: Partial<UserProfile>) => save({ ...profileRef.current, ...patch });
  const resetProfile = async () => save(DEFAULT_PROFILE);

  // ── Sync LinkedIn sign-in data into the profile (fills empty fields only) ──
  useEffect(() => {
    try {
      if (!hydrated || !user) return;
      if (syncedFor.current === user.uid) return; // sync once per user
      syncedFor.current = user.uid;

      const p = profileRef.current;
      const li = user.linkedin || {};
      const s = (v: any): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
      const patch: Partial<UserProfile> = {};

      if (!p.displayName && user.displayName) patch.displayName = s(user.displayName);
      if (!p.email && user.email) patch.email = s(user.email);
      if (!p.photoUri && user.photoURL) patch.photoUri = s(user.photoURL); // adopt LinkedIn avatar
      if (user.provider === 'linkedin') {
        if (!p.title && li.headline) patch.title = s(li.headline);
        if (!p.bio && li.bio) patch.bio = s(li.bio);
        if (!p.location && li.location) patch.location = s(li.location);
        if (!p.currentCompany && li.company) patch.currentCompany = s(li.company);
        if (!p.linkedinUrl && li.linkedinUrl) patch.linkedinUrl = s(li.linkedinUrl);
      }

      if (Object.keys(patch).length > 0) save({ ...p, ...patch });
    } catch (err) {
      console.error('Profile sync skipped:', err);
    }
  }, [hydrated, user?.uid, user?.provider]);

  return (
    <Ctx.Provider value={{ profile, updateProfile, resetProfile, profileCompletion: calcCompletion(profile) }}>
      {children}
    </Ctx.Provider>
  );
};
