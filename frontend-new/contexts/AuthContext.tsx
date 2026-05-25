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
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
};

const LOCAL_PREVIEW_USER_KEY = 'swipeconnect.previewUser';
const LOCAL_AUTH_TOKEN_KEY = 'swipeconnect.authToken';
const isPreviewAuthEnabled = Platform.OS === 'web' || process.env.EXPO_PUBLIC_ENABLE_DEMO_AUTH !== 'false';

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

const createPreviewUser = (email: string, displayName?: string): AuthUser => {
  if (email.toLowerCase() === 'preview@swipeconnect.app') {
    return {
      uid: 'preview-user',
      email,
      displayName: displayName || 'Preview User',
      photoURL: null,
    };
  }

  const nameFromEmail = email.split('@')[0]?.replace(/[._-]/g, ' ') || 'Preview User';
  const normalizedName = nameFromEmail
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    uid: `preview-${email.toLowerCase()}`,
    email,
    displayName: displayName || normalizedName || 'Preview User',
    photoURL: null,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const saveSignedInUser = async (nextUser: AuthUser) => {
      await AsyncStorage.setItem(LOCAL_PREVIEW_USER_KEY, JSON.stringify(nextUser));
      if (nextUser.authToken) {
        await AsyncStorage.setItem(LOCAL_AUTH_TOKEN_KEY, nextUser.authToken);
      }
      if (isMounted) {
        setUser(nextUser);
      }
    };

    const loadLinkedInUser = async (token: string) => {
      const response = await fetch(`${toApiRoot()}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Unable to load LinkedIn profile.');
      }

      const profile = await response.json();
      await saveSignedInUser({
        uid: profile._id || profile.id,
        email: profile.email,
        displayName: profile.displayName || profile.name,
        photoURL: profile.photoURL || profile.profilePicture || null,
        authToken: token,
      });
    };

    const loadPreviewUser = async () => {
      try {
        const callbackToken = getLinkedInCallbackToken();
        if (callbackToken) {
          await loadLinkedInUser(callbackToken);
          return;
        }

        const savedUser = await AsyncStorage.getItem(LOCAL_PREVIEW_USER_KEY);
        if (savedUser && isMounted) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading preview user:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (isPreviewAuthEnabled) {
      loadPreviewUser();
      return () => {
        isMounted = false;
      };
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser) {
        setUser(toAuthUser(firebaseUser));
        setLoading(false);
        return;
      }

      loadPreviewUser();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const savePreviewUser = async (previewUser: AuthUser) => {
    await AsyncStorage.setItem(LOCAL_PREVIEW_USER_KEY, JSON.stringify(previewUser));
    setUser(previewUser);
  };

  const clearPreviewUser = async () => {
    try {
      await AsyncStorage.removeItem(LOCAL_PREVIEW_USER_KEY);
      await AsyncStorage.removeItem(LOCAL_AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing preview user:', error);
    }
  };

  const signInWithPreviewFallback = async (email: string, displayName?: string) => {
    if (!isPreviewAuthEnabled) {
      throw new Error('Preview authentication is disabled.');
    }

    await savePreviewUser(createPreviewUser(email, displayName));
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setAuthActionLoading(true);
    try {
      if (isPreviewAuthEnabled) {
        await signInWithPreviewFallback(email, displayName);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      setUser({ ...toAuthUser(userCredential.user), displayName });
      await clearPreviewUser();
    } catch (error) {
      await signInWithPreviewFallback(email, displayName);
    } finally {
      setAuthActionLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setAuthActionLoading(true);
    try {
      if (isPreviewAuthEnabled) {
        await signInWithPreviewFallback(email);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(toAuthUser(userCredential.user));
      await clearPreviewUser();
    } catch (error) {
      await signInWithPreviewFallback(email);
    } finally {
      setAuthActionLoading(false);
    }
  };

  const logout = async () => {
    setAuthActionLoading(true);
    try {
      await clearPreviewUser();
      await signOut(auth);
      setUser(null);
    } finally {
      setAuthActionLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      if (!isPreviewAuthEnabled) {
        throw error;
      }
    } finally {
      setAuthActionLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!user) throw new Error('No user logged in');

    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName, photoURL });
    }

    const updatedUser = { ...user, displayName, photoURL: photoURL ?? user.photoURL };
    setUser(updatedUser);

    if (isPreviewAuthEnabled) {
      await AsyncStorage.setItem(LOCAL_PREVIEW_USER_KEY, JSON.stringify(updatedUser));
    }
  };

  const isCurrentlyLoading = loading || authActionLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: isCurrentlyLoading,
        isLoading: isCurrentlyLoading,
        signUp,
        signIn,
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
