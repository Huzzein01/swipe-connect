import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

type AuthContextType = {
  user: User | null;
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

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    setAuthActionLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName });
    } finally {
      setAuthActionLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setAuthActionLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setAuthActionLoading(false);
    }
  };

  const logout = async () => {
    setAuthActionLoading(true);
    try {
      await signOut(auth);
    } finally {
      setAuthActionLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } finally {
      setAuthActionLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!user) throw new Error('No user logged in');
    await updateProfile(user, { displayName, photoURL });
  };

  const register = signUp;
  const login = signIn;

  const isCurrentlyLoading = loading || authActionLoading;

  const value = {
    user,
    loading: isCurrentlyLoading,
    isLoading: isCurrentlyLoading,
    signUp,
    signIn,
    logout,
    resetPassword,
    updateUserProfile,
    register,
    login,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
