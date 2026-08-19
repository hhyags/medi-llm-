'use client';

// MedFlow AI CRM — Enterprise Authentication Context
// Uses Firebase Authentication as the authoritative identity source.
// Falls back to localStorage demo session when Firebase is not configured
// (NEXT_PUBLIC_FIREBASE_API_KEY not set), preserving full offline demo capability.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole, Hospital } from '../types/medflow';
import { storageService } from '../lib/services/storage';
import { isFirebaseConfigured } from '../lib/firebase/config';
import { getFirebaseAuth } from '../lib/firebase/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: { uid: string; email: string } | null;
  profile: UserProfile | null;
  role: UserRole | null;
  hospitalId: string;
  hospital: Hospital | null;
  loading: boolean;
  isAuthenticated: boolean;
  isFirebaseMode: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoAccount: (email: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Profile loader (shared between Firebase and demo modes) ──────────────────
  const loadProfileByUid = useCallback((uid: string): UserProfile | null => {
    const found = storageService.getUserByUid(uid);
    if (found) {
      setProfile(found);
      setHospital(storageService.getHospitalById(found.hospitalId) || null);
      return found;
    }
    setProfile(null);
    setHospital(null);
    return null;
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
    setHospital(null);
  }, []);

  // ── Auth State Initialization ─────────────────────────────────────────────────
  useEffect(() => {
    const auth = getFirebaseAuth();

    if (auth) {
      // ── FIREBASE MODE: onAuthStateChanged is the single source of truth ────────
      // Dynamically import to keep Firebase out of the bundle when unconfigured
      let unsubscribe: (() => void) | undefined;
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            // Identity confirmed by Firebase — now load role/hospitalId from Firestore/localStorage
            loadProfileByUid(firebaseUser.uid);
          } else {
            clearProfile();
          }
          setLoading(false);
        });
      });
      return () => unsubscribe?.();
    } else {
      // ── DEMO/OFFLINE MODE: use localStorage session UID ──────────────────────
      const activeUid = storageService.getActiveSessionUid();
      if (activeUid) {
        loadProfileByUid(activeUid);
      } else {
        clearProfile();
      }
      setLoading(false);

      // Subscribe to storage changes (e.g. switchDemoAccount triggers a re-sync)
      const unsub = storageService.subscribe(() => {
        const uid = storageService.getActiveSessionUid();
        if (uid) {
          loadProfileByUid(uid);
        } else {
          clearProfile();
        }
      });
      return () => unsub();
    }
  }, [loadProfileByUid, clearProfile]);

  // ── Login ─────────────────────────────────────────────────────────────────────
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);

    const auth = getFirebaseAuth();

    if (auth) {
      // ── FIREBASE MODE ───────────────────────────────────────────────────────
      if (!password) {
        setLoading(false);
        return { success: false, error: 'Password is required.' };
      }
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        // onAuthStateChanged will fire and load the profile automatically
        const foundProfile = loadProfileByUid(credential.user.uid);
        if (!foundProfile) {
          // Authenticated in Firebase but no Firestore profile found
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
          setLoading(false);
          return { success: false, error: 'Your account exists in Firebase Auth but no hospital profile was found. Contact your administrator.' };
        }
        storageService.logAudit(
          foundProfile.hospitalId, 'USER_LOGIN', 'user', foundProfile.uid,
          `Firebase Auth: User ${foundProfile.name} signed in`, foundProfile
        );
        setLoading(false);
        router.push('/dashboard');
        return { success: true };
      } catch (err: unknown) {
        setLoading(false);
        const code = (err as { code?: string })?.code ?? '';
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          return { success: false, error: 'Invalid email or password.' };
        }
        if (code === 'auth/too-many-requests') {
          return { success: false, error: 'Too many sign-in attempts. Please try again later.' };
        }
        if (code === 'auth/network-request-failed') {
          return { success: false, error: 'Network error. Check your connection and try again.' };
        }
        console.error('[MedFlow] Firebase sign-in error:', err);
        return { success: false, error: 'Authentication failed. Please try again.' };
      }
    } else {
      // ── DEMO/OFFLINE MODE ───────────────────────────────────────────────────
      const user = storageService.getUserByEmail(email.trim());
      if (!user) {
        setLoading(false);
        return { success: false, error: 'User account not found. Please select a valid demo account.' };
      }
      if (user.status !== 'active') {
        setLoading(false);
        return { success: false, error: 'This account is inactive. Contact your administrator.' };
      }
      storageService.setActiveSessionUid(user.uid);
      setProfile(user);
      setHospital(storageService.getHospitalById(user.hospitalId) || null);
      storageService.logAudit(user.hospitalId, 'USER_LOGIN', 'user', user.uid, `Demo: User ${user.name} logged in`, user);
      setLoading(false);
      router.push('/dashboard');
      return { success: true };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    if (profile) {
      storageService.logAudit(
        profile.hospitalId, 'USER_LOGOUT', 'user', profile.uid,
        `User ${profile.name} logged out`, profile
      );
    }

    const auth = getFirebaseAuth();
    if (auth) {
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
      // onAuthStateChanged fires → clears profile
    } else {
      storageService.setActiveSessionUid(null);
      clearProfile();
    }
    router.push('/login');
  };

  // ── Demo Account Switcher ─────────────────────────────────────────────────────
  // Switches between test accounts. In Firebase mode, signs in via signInWithEmailAndPassword.
  // In demo mode, swaps the localStorage session UID directly.
  const DEMO_PASSWORD = 'MedFlow2026!';

  const switchDemoAccount = async (email: string): Promise<void> => {
    const auth = getFirebaseAuth();

    if (auth) {
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const credential = await signInWithEmailAndPassword(auth, email, DEMO_PASSWORD);
        loadProfileByUid(credential.user.uid);
        storageService.logAudit('', 'DEMO_ACCOUNT_SWITCH', 'user', credential.user.uid, `Firebase: Switched to ${email}`, undefined);
      } catch (err) {
        console.error('[MedFlow] switchDemoAccount Firebase error:', err);
        // Graceful fallback: if Firebase fails, swap via localStorage
        const user = storageService.getUserByEmail(email);
        if (user) {
          storageService.setActiveSessionUid(user.uid);
          loadProfileByUid(user.uid);
        }
      }
    } else {
      const user = storageService.getUserByEmail(email);
      if (user) {
        storageService.setActiveSessionUid(user.uid);
        loadProfileByUid(user.uid);
        storageService.logAudit(
          user.hospitalId, 'DEMO_ACCOUNT_SWITCH', 'user', user.uid,
          `Demo: Switched session to ${user.name} (${user.role})`, user
        );
      }
    }
  };

  // ── Derived State ──────────────────────────────────────────────────────────────
  const isAuthenticated = Boolean(profile);
  const role = profile?.role ?? null;
  const hospitalId = profile?.hospitalId ?? '';
  const user = profile ? { uid: profile.uid, email: profile.email } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        hospitalId,
        hospital,
        loading,
        isAuthenticated,
        isFirebaseMode: isFirebaseConfigured,
        login,
        logout,
        switchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
