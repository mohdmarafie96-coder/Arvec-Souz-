import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, fbSignOut, handleFirestoreError, OperationType } from './config';

export interface UserProfile {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalPoints: number;
  solvesCount: number;
  bestRubikMs?: number;
  currentStreak: number;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addPoints: (points: number, solveMs?: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  addPoints: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or create user profile
  const fetchProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        // Initial profile creation
        const newProfile: UserProfile = {
          userId: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Arcade Cuber',
          photoURL: firebaseUser.photoURL || '',
          totalPoints: 0,
          solvesCount: 0,
          currentStreak: 1,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchProfile(result.user);
      }
    } catch (err: unknown) {
      console.error('Google Sign-in failed', err);
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setProfile(null);
    } catch (err: unknown) {
      console.error('Sign-out failed', err);
    }
  };

  const addPoints = async (points: number, solveMs?: number) => {
    if (!user) return;
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

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        logout,
        addPoints,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
