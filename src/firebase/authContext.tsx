import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  fbSignOut,
} from './config';

export interface UserAuthProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'shopper';
  status: 'approved' | 'pending_approval' | 'rejected';
  hubCity?: string;
  isSimulated?: boolean;
}

export interface AuthErrorInfo {
  code: string;
  message: string;
  domain: string;
  consoleUrl: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserAuthProfile | null;
  loading: boolean;
  authError: AuthErrorInfo | null;
  loginWithGoogle: () => Promise<void>;
  loginAsAdmin: () => void;
  loginAsShopper: (name?: string, hub?: string) => void;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const LOCAL_SESSION_KEY = 'arvec_souz_luxury_auth_v2';
const ADMIN_EMAIL = 'mohdmarafie96@gmail.com';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  loginWithGoogle: async () => {},
  loginAsAdmin: () => {},
  loginAsShopper: () => {},
  logout: async () => {},
  clearAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserAuthProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<AuthErrorInfo | null>(null);

  // Restore simulated or local personal shopper session if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SESSION_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const isAdmin = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const p: UserAuthProfile = {
          userId: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || (isAdmin ? 'Mohd Marafie (Admin)' : 'Personal Shopper'),
          photoURL: currentUser.photoURL || undefined,
          role: isAdmin ? 'admin' : 'shopper',
          status: isAdmin ? 'approved' : 'pending_approval',
          hubCity: 'London / Paris Desk',
        };
        setProfile(p);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(p));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthException = (err: unknown) => {
    console.warn('Firebase Auth notice:', err);
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
      message = `Domain (${domain}) requires adding to Firebase Console Authorized Domains. Use Direct Login below to continue seamlessly.`;
    } else if (code === 'auth/popup-closed-by-user') {
      message = 'The sign-in popup was closed or blocked by browser security. You can sign in directly below as Admin or Personal Shopper.';
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
        const isAdmin = result.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const p: UserAuthProfile = {
          userId: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || (isAdmin ? 'Mohd Marafie (Admin)' : 'Personal Shopper'),
          photoURL: result.user.photoURL || undefined,
          role: isAdmin ? 'admin' : 'shopper',
          status: isAdmin ? 'approved' : 'pending_approval',
          hubCity: 'London / Paris',
        };
        setProfile(p);
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(p));
      }
    } catch (err: unknown) {
      handleAuthException(err);
    }
  };

  // 1-Click Admin Access for Mohd Marafie
  const loginAsAdmin = () => {
    const adminProfile: UserAuthProfile = {
      userId: 'admin_marafie_01',
      email: ADMIN_EMAIL,
      displayName: 'Mohd Marafie',
      role: 'admin',
      status: 'approved',
      hubCity: 'Kuwait HQ & London Desk',
      isSimulated: true,
    };
    setProfile(adminProfile);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(adminProfile));
    setAuthError(null);
  };

  // 1-Click Shopper Access
  const loginAsShopper = (name = 'European Personal Shopper', hub = 'London / Harrods') => {
    const shopperProfile: UserAuthProfile = {
      userId: `shopper_${Math.floor(1000 + Math.random() * 9000)}`,
      email: 'shopper@arvecsouz.com',
      displayName: name,
      role: 'shopper',
      status: 'approved',
      hubCity: hub,
      isSimulated: true,
    };
    setProfile(shopperProfile);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(shopperProfile));
    setAuthError(null);
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    setUser(null);
    setProfile(null);
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
        loginAsAdmin,
        loginAsShopper,
        logout,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
