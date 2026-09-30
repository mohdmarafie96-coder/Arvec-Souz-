import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  fbSignOut,
  handleFirestoreError,
  OperationType,
} from './config';

export interface UserProfile {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalPoints: number;
  solvesCount: number;
  bestRubikMs?: number;
  currentStreak: number;
  isGuest?: boolean;
  updatedAt?: string;
}

export interface AuthErrorInfo {
  code: string;
  message: string;
  domain: string;
  consoleUrl: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: AuthErrorInfo | null;
  loginWithGoogle: () => Promise<void>;
  loginWithRedirectOption: () => Promise<void>;
  logout: () => Promise<void>;
  addPoints: (points: number, solveMs?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuthError: () => void;
  setGuestNickname: (nickname: string) => void;
}

const GUEST_PROFILE_KEY = 'arvec_souz_guest_profile_v1';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  loginWithGoogle: async () => {},
  loginWithRedirectOption: async () => {},
  logout: async () => {},
  addPoints: async () => {},
  refreshProfile: async () => {},
  clearAuthError: () => {},
  setGuestNickname: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);

  // Load guest profile if not logged in
  const loadGuestProfile = (): UserProfile => {
    try {
      const saved = localStorage.getItem(GUEST_PROFILE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // LocalStorage fallback
    }
    return {
      userId: 'guest_local',
      displayName: 'Guest Cuber',
      totalPoints: 0,
      solvesCount: 0,
      currentStreak: 1,
      isGuest: true,
      updatedAt: new Date().toISOString(),
    };
  };

  // Fetch or create user profile from Firestore
  const fetchProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const cloudData = snap.data() as UserProfile;
        // Merge guest points if any exist
        const guest = loadGuestProfile();
        if (guest.totalPoints > 0) {
          const mergedPoints = cloudData.totalPoints + guest.totalPoints;
          const mergedSolves = cloudData.solvesCount + guest.solvesCount;
          await updateDoc(userDocRef, {
            totalPoints: mergedPoints,
            solvesCount: mergedSolves,
            updatedAt: new Date().toISOString(),
          });
          cloudData.totalPoints = mergedPoints;
          cloudData.solvesCount = mergedSolves;
          localStorage.removeItem(GUEST_PROFILE_KEY);
        }
        setProfile(cloudData);
      } else {
        // Initial profile creation
        const guest = loadGuestProfile();
        const newProfile: UserProfile = {
          userId: firebaseUser.uid,
          displayName: firebaseUser.displayName || guest.displayName || 'Arcade Cuber',
          photoURL: firebaseUser.photoURL || '',
          totalPoints: guest.totalPoints || 0,
          solvesCount: guest.solvesCount || 0,
          currentStreak: 1,
          isGuest: false,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
        localStorage.removeItem(GUEST_PROFILE_KEY);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  // Handle redirect result if user used redirect login
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          setUser(result.user);
          await fetchProfile(result.user);
        }
      })
      .catch((err: unknown) => {
        handleAuthException(err);
      });
  }, []);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(loadGuestProfile());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthException = (err: unknown) => {
    console.warn('Firebase Auth error encountered:', err);
    const domain = typeof window !== 'undefined' ? window.location.hostname : 'unknown-domain';
    const projectId = 'gen-lang-client-0805549924';
    const consoleUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

    let code = 'auth/unknown';
    let message = 'An error occurred during authentication.';

    if (err && typeof err === 'object' && 'code' in err) {
      code = String((err as { code: string }).code);
      message = String((err as { message?: string }).message || message);
    }

    if (code === 'auth/unauthorized-domain') {
      message = `This domain (${domain}) is not authorized in your Firebase Console. Google Sign-In requires adding this domain to Firebase Authentication settings.`;
    } else if (code === 'auth/popup-closed-by-user') {
      message = 'The sign-in popup was closed before completing authentication. If it closed automatically, the domain is likely unauthorized in Firebase Console.';
    } else if (code === 'auth/popup-blocked') {
      message = 'The sign-in popup was blocked by your browser. Please allow popups or use the Redirect option.';
    }

    setAuthError({
      code,
      message,
      domain,
      consoleUrl,
    });
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchProfile(result.user);
      }
    } catch (err: unknown) {
      handleAuthException(err);
    }
  };

  const loginWithRedirectOption = async () => {
    setAuthError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: unknown) {
      handleAuthException(err);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setProfile(loadGuestProfile());
    } catch (err: unknown) {
      console.error('Sign-out failed', err);
    }
  };

  const setGuestNickname = (nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) return;
    setProfile((prev) => {
      const next: UserProfile = prev
        ? { ...prev, displayName: trimmed }
        : {
            userId: 'guest_local',
            displayName: trimmed,
            totalPoints: 0,
            solvesCount: 0,
            currentStreak: 1,
            isGuest: true,
          };
      try {
        localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(next));
      } catch {
        // fallback
      }
      return next;
    });
  };

  const addPoints = async (points: number, solveMs?: number) => {
    if (!user) {
      // Save locally to guest profile
      setProfile((prev) => {
        const cur = prev || loadGuestProfile();
        const updatedPoints = cur.totalPoints + points;
        const updatedSolves = cur.solvesCount + 1;
        const bestTime =
          solveMs && (!cur.bestRubikMs || solveMs < cur.bestRubikMs)
            ? solveMs
            : cur.bestRubikMs;

        const next: UserProfile = {
          ...cur,
          totalPoints: updatedPoints,
          solvesCount: updatedSolves,
          ...(bestTime ? { bestRubikMs: bestTime } : {}),
          updatedAt: new Date().toISOString(),
        };

        try {
          localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(next));
        } catch {
          // fallback
        }
        return next;
      });
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const updatedPoints = (profile?.totalPoints || 0) + points;
    const updatedSolves = (profile?.solvesCount || 0) + 1;
    const bestTime =
      solveMs && (!profile?.bestRubikMs || solveMs < profile.bestRubikMs)
        ? solveMs
        : profile?.bestRubikMs;

    try {
      await updateDoc(userDocRef, {
        totalPoints: updatedPoints,
        solvesCount: updatedSolves,
        ...(bestTime ? { bestRubikMs: bestTime } : {}),
        updatedAt: new Date().toISOString(),
      });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              totalPoints: updatedPoints,
              solvesCount: updatedSolves,
              ...(bestTime ? { bestRubikMs: bestTime } : {}),
            }
          : null
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        loginWithGoogle,
        loginWithRedirectOption,
        logout,
        addPoints,
        refreshProfile,
        clearAuthError,
        setGuestNickname,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
