import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { jobService } from '../services/jobService';

type AuthUser = Pick<FirebaseUser, 'uid' | 'email' | 'displayName' | 'photoURL'> & {
  authToken?: string;
  provider?: 'email' | 'linkedin' | 'preview';
  // Optional LinkedIn-sourced fields used to sync the in-app profile
  linkedin?: {
    headline?: string;
    bio?: string;
    location?: string;
    linkedinUrl?: string;
    company?: string;
  };
};

export type SignInRecord = {
  id: string;
  email: string;
  method: 'email' | 'linkedin' | 'preview' | 'signup';
  platform: string;
  at: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isLoading: boolean;
  signInHistory: SignInRecord[];
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInPreview: (email?: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
};

const LOCAL_PREVIEW_USER_KEY = 'swipeconnect.previewUser';
const LOCAL_AUTH_TOKEN_KEY = 'swipeconnect.authToken';
const LOCAL_SIGN_IN_HISTORY_KEY = 'swipeconnect.signInHistory';

// Preview auth is only used when explicitly invoked — NOT as a fallback for failed logins.
const previewAuthAvailable = process.env.EXPO_PUBLIC_ENABLE_DEMO_AUTH !== 'false';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

const toApiRoot = () => jobService.apiBaseUrl.replace(/\/api$/, '');

const getLinkedInCallbackToken = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  if (!token) return null;
  url.searchParams.delete('token');
  window.history.replaceState({}, document.title, url.pathname === '/auth/callback' ? '/' : url.toString());
  return token;
};

const toAuthUser = (firebaseUser: FirebaseUser): AuthUser => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
});

const buildPreviewUser = (email: string, displayName?: string): AuthUser => {
  if (email.toLowerCase() === 'preview@swipeconnect.app') {
    return { uid: 'preview-user', email, displayName: displayName || 'Preview User', photoURL: null };
  }
  const fromEmail = email.split('@')[0]?.replace(/[._-]/g, ' ') || 'Preview User';
  const normalized = fromEmail.split(' ').filter(Boolean).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  return {
    uid: `preview-${email.toLowerCase()}`,
    email,
    displayName: displayName || normalized || 'Preview User',
    photoURL: null,
  };
};

/** Map Firebase error codes to user-friendly messages */
const firebaseAuthError = (error: any): Error => {
  const code: string = error?.code || '';
  if (code === 'auth/user-not-found' || code === 'auth/invalid-email') {
    return new Error('No account found with this email address.');
  }
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return new Error('Incorrect password. Please try again.');
  }
  if (code === 'auth/too-many-requests') {
    return new Error('Too many attempts. Please wait a moment and try again.');
  }
  if (code === 'auth/email-already-in-use') {
    return new Error('An account with this email already exists. Try signing in instead.');
  }
  if (code === 'auth/weak-password') {
    return new Error('Password must be at least 6 characters.');
  }
  if (code === 'auth/network-request-failed') {
    return new Error('Network error. Check your connection and try again.');
  }
  return new Error('Authentication failed. Please try again.');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [signInHistory, setSignInHistory] = useState<SignInRecord[]>([]);

  const recordSignIn = async (method: SignInRecord['method'], email?: string | null) => {
    const stored = await AsyncStorage.getItem(LOCAL_SIGN_IN_HISTORY_KEY);
    const previous: SignInRecord[] = stored ? JSON.parse(stored) : signInHistory;
    const next: SignInRecord = {
      id: `signin-${Date.now()}`,
      email: email || 'unknown@swipeconnect.app',
      method,
      platform: Platform.OS,
      at: new Date().toISOString(),
    };
    const history = [next, ...previous].slice(0, 25);
    await AsyncStorage.setItem(LOCAL_SIGN_IN_HISTORY_KEY, JSON.stringify(history));
    setSignInHistory(history);
  };

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      const raw = await AsyncStorage.getItem(LOCAL_SIGN_IN_HISTORY_KEY);
      if (raw && mounted) setSignInHistory(JSON.parse(raw));
    };

    const saveUser = async (nextUser: AuthUser) => {
      await AsyncStorage.setItem(LOCAL_PREVIEW_USER_KEY, JSON.stringify(nextUser));
      if (nextUser.authToken) await AsyncStorage.setItem(LOCAL_AUTH_TOKEN_KEY, nextUser.authToken);
      if (mounted) setUser(nextUser);
    };

    const loadLinkedInUser = async (token: string) => {
      const res = await fetch(`${toApiRoot()}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Unable to load LinkedIn profile.');
      const profile = await res.json();
      await saveUser({
        uid: profile._id || profile.id,
        email: profile.email,
        displayName: profile.displayName || profile.name,
        photoURL: profile.photoURL || profile.profilePicture || profile.picture || null,
        authToken: token,
        provider: 'linkedin',
        linkedin: {
          headline: profile.headline || profile.localizedHeadline || '',
          bio: profile.summary || profile.bio || '',
          location: profile.location?.name || profile.location || profile.locale || '',
          linkedinUrl: profile.publicProfileUrl || profile.profileUrl || profile.linkedinUrl || '',
          company: profile.company || profile.positions?.[0]?.companyName || '',
        },
      });
      await recordSignIn('linkedin', profile.email);
    };

    const boot = async () => {
      try {
        await loadHistory();
        const callbackToken = getLinkedInCallbackToken();
        if (callbackToken) {
          await loadLinkedInUser(callbackToken);
          return;
        }
        // Restore persisted preview/LinkedIn session
        const saved = await AsyncStorage.getItem(LOCAL_PREVIEW_USER_KEY);
        if (saved && mounted) setUser(JSON.parse(saved));
      } catch (err) {
        console.error('Auth boot error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // Always listen to Firebase auth state; boot() handles preview/LinkedIn sessions
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!mounted) return;
      if (firebaseUser) {
        setUser(toAuthUser(firebaseUser));
        setLoading(false);
      } else {
        boot();
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const clearPersistedSession = async () => {
    await AsyncStorage.removeItem(LOCAL_PREVIEW_USER_KEY);
    await AsyncStorage.removeItem(LOCAL_AUTH_TOKEN_KEY);
  };

  // ─── Sign up (Firebase only) ───────────────────────────────────────────────
  const signUp = async (email: string, password: string, displayName: string) => {
    setAuthActionLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      setUser({ ...toAuthUser(cred.user), displayName });
      await clearPersistedSession();
      await recordSignIn('signup', email);
    } catch (error) {
      throw firebaseAuthError(error);
    } finally {
      setAuthActionLoading(false);
    }
  };

  // ─── Sign in (Firebase only) ───────────────────────────────────────────────
  const signIn = async (email: string, password: string) => {
    setAuthActionLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setUser(toAuthUser(cred.user));
      await clearPersistedSession();
      await recordSignIn('email', email);
    } catch (error) {
      throw firebaseAuthError(error);
    } finally {
      setAuthActionLoading(false);
    }
  };

  // ─── Preview sign-in (explicit, not a fallback) ────────────────────────────
  const signInPreview = async (email = 'preview@swipeconnect.app', displayName?: string) => {
    if (!previewAuthAvailable) throw new Error('Preview login is not enabled.');
    setAuthActionLoading(true);
    try {
      const previewUser = buildPreviewUser(email, displayName);
      await AsyncStorage.setItem(LOCAL_PREVIEW_USER_KEY, JSON.stringify(previewUser));
      setUser(previewUser);
      await recordSignIn('preview', email);
    } finally {
      setAuthActionLoading(false);
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    setAuthActionLoading(true);
    try {
      await clearPersistedSession();
      await signOut(auth);
      setUser(null);
    } finally {
      setAuthActionLoading(false);
    }
  };

  // ─── Reset password ────────────────────────────────────────────────────────
  const resetPassword = async (email: string) => {
    setAuthActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw firebaseAuthError(error);
    } finally {
      setAuthActionLoading(false);
    }
  };

  // ─── Update profile ────────────────────────────────────────────────────────
  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!user) throw new Error('No user logged in');
    if (auth.currentUser) await updateProfile(auth.currentUser, { displayName, photoURL });
    const updated = { ...user, displayName, photoURL: photoURL ?? user.photoURL };
    setUser(updated);
    // Keep persisted session up to date if it's a preview user
    const saved = await AsyncStorage.getItem(LOCAL_PREVIEW_USER_KEY);
    if (saved) await AsyncStorage.setItem(LOCAL_PREVIEW_USER_KEY, JSON.stringify(updated));
  };

  const isCurrentlyLoading = loading || authActionLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isCurrentlyLoading,
        isLoading: isCurrentlyLoading,
        signInHistory,
        signUp,
        signIn,
        signInPreview,
        logout,
        resetPassword,
        updateUserProfile,
        register: signUp,
        login: signIn,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
