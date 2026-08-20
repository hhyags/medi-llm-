'use client';

// MedFlow AI CRM — Enterprise Authentication Context
// Uses Firebase Authentication (Email/Password & Google Sign-In) + Cloud Firestore
// Falls back gracefully to offline demo session when Firebase is unconfigured.

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile, UserRole, Hospital } from '../types/medflow';
import { storageService } from '../lib/services/storage';
import { isFirebaseConfigured } from '../lib/firebase/config';
import { getFirebaseAuth, getFirebaseDb } from '../lib/firebase/firebase';

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
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role?: UserRole, hospitalId?: string) => Promise<{ success: boolean; error?: string }>;
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

  // ── Sync user profile from Firestore or local storage ───────────────────────
  const fetchAndSetProfile = useCallback(async (uid: string, email?: string | null, displayName?: string | null): Promise<UserProfile | null> => {
    // 1. Try Firestore if configured
    const db = getFirebaseDb();
    if (db) {
      try {
        const { doc, getDoc, setDoc } = await import('firebase/firestore');
        const userDocRef = doc(db, 'users', uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          storageService.upsertUser(data);
          setProfile(data);
          setHospital(storageService.getHospitalById(data.hospitalId) || null);
          return data;
        } else {
          // Document doesn't exist yet in Firestore — check local seed/cache by email or UID
          const localUser = storageService.getUserByUid(uid) || (email ? storageService.getUserByEmail(email) : undefined);
          const newProfile: UserProfile = localUser
            ? { ...localUser, uid }
            : {
                uid,
                name: displayName || email?.split('@')[0] || 'Hospital Staff',
                email: email || '',
                phone: '',
                role: 'admin', // Default to admin for initial project owners
                hospitalId: 'hospital_001',
                department: 'Administration',
                status: 'active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

          await setDoc(userDocRef, newProfile, { merge: true });
          storageService.upsertUser(newProfile);
          setProfile(newProfile);
          setHospital(storageService.getHospitalById(newProfile.hospitalId) || null);
          return newProfile;
        }
      } catch (firestoreErr) {
        console.warn('[MedFlow] Firestore profile lookup warning, using local cache:', firestoreErr);
      }
    }

    // 2. Fallback to LocalStorage cache
    const found = storageService.getUserByUid(uid) || (email ? storageService.getUserByEmail(email) : undefined);
    if (found) {
      const synced = { ...found, uid };
      setProfile(synced);
      setHospital(storageService.getHospitalById(synced.hospitalId) || null);
      return synced;
    }

    if (email) {
      // Create ad-hoc profile in local cache
      const created: UserProfile = {
        uid,
        name: displayName || email.split('@')[0],
        email,
        phone: '',
        role: 'admin',
        hospitalId: 'hospital_001',
        department: 'Administration',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storageService.upsertUser(created);
      setProfile(created);
      setHospital(storageService.getHospitalById('hospital_001') || null);
      return created;
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
      // ── FIREBASE MODE: onAuthStateChanged is authoritative ────────────────────
      let unsubscribe: (() => void) | undefined;
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            await fetchAndSetProfile(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);
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
        const found = storageService.getUserByUid(activeUid);
        if (found) {
          setProfile(found);
          setHospital(storageService.getHospitalById(found.hospitalId) || null);
        } else {
          clearProfile();
        }
      } else {
        clearProfile();
      }
      setLoading(false);

      const unsub = storageService.subscribe(() => {
        const uid = storageService.getActiveSessionUid();
        if (uid) {
          const user = storageService.getUserByUid(uid);
          if (user) {
            setProfile(user);
            setHospital(storageService.getHospitalById(user.hospitalId) || null);
          } else {
            clearProfile();
          }
        } else {
          clearProfile();
        }
      });
      return () => unsub();
    }
  }, [fetchAndSetProfile, clearProfile]);

  // ── Login with Email / Password ───────────────────────────────────────────────
  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim();

    const auth = getFirebaseAuth();

    if (auth) {
      if (!password) {
        setLoading(false);
        return { success: false, error: 'Password is required.' };
      }
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const userProfile = await fetchAndSetProfile(credential.user.uid, credential.user.email, credential.user.displayName);
        
        if (userProfile) {
          storageService.logAudit(
            userProfile.hospitalId, 'USER_LOGIN', 'user', userProfile.uid,
            `Firebase Auth: ${userProfile.name} (${userProfile.email}) logged in`, userProfile
          );
        }

        setLoading(false);
        router.push('/dashboard');
        return { success: true };
      } catch (err: unknown) {
        setLoading(false);
        const code = (err as { code?: string })?.code ?? '';
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          // Check if user is trying a seeded demo account that hasn't been signed up in Firebase Auth yet
          const seedUser = storageService.getUserByEmail(cleanEmail);
          if (seedUser) {
            // Attempt seamless auto-provisioning in Firebase Auth for seamless developer experience
            try {
              const { createUserWithEmailAndPassword } = await import('firebase/auth');
              const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
              await fetchAndSetProfile(newCred.user.uid, cleanEmail, seedUser.name);
              router.push('/dashboard');
              return { success: true };
            } catch {
              return { success: false, error: 'Invalid email or password.' };
            }
          }
          return { success: false, error: 'Invalid email or password.' };
        }
        if (code === 'auth/too-many-requests') {
          return { success: false, error: 'Too many sign-in attempts. Please try again later.' };
        }
        if (code === 'auth/network-request-failed') {
          return { success: false, error: 'Network error. Please check your connection.' };
        }
        console.error('[MedFlow] Firebase sign-in error:', err);
        return { success: false, error: (err as { message?: string })?.message || 'Authentication failed.' };
      }
    } else {
      // ── DEMO/OFFLINE MODE ───────────────────────────────────────────────────
      const user = storageService.getUserByEmail(cleanEmail);
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

  // ── Login with Google ─────────────────────────────────────────────────────────
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const auth = getFirebaseAuth();

    if (auth) {
      try {
        const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;

        const userProfile = await fetchAndSetProfile(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);

        if (userProfile) {
          storageService.logAudit(
            userProfile.hospitalId, 'USER_LOGIN', 'user', userProfile.uid,
            `Google Sign-In: ${userProfile.name} (${userProfile.email}) logged in`, userProfile
          );
        }

        setLoading(false);
        router.push('/dashboard');
        return { success: true };
      } catch (err: unknown) {
        setLoading(false);
        const code = (err as { code?: string })?.code ?? '';
        if (code === 'auth/popup-closed-by-user') {
          return { success: false, error: 'Sign-in popup was closed before completing.' };
        }
        if (code === 'auth/unauthorized-domain') {
          return {
            success: false,
            error: 'Domain not authorized in Firebase Console. Add localhost to Authentication > Settings > Authorized domains.'
          };
        }
        console.error('[MedFlow] Google Sign-In error:', err);
        return { success: false, error: (err as { message?: string })?.message || 'Google Sign-In failed.' };
      }
    } else {
      // Demo fallback for Google Sign-In
      const defaultAdmin = storageService.getUserByEmail('admin1@medflow.com');
      if (defaultAdmin) {
        storageService.setActiveSessionUid(defaultAdmin.uid);
        setProfile(defaultAdmin);
        setHospital(storageService.getHospitalById(defaultAdmin.hospitalId) || null);
        setLoading(false);
        router.push('/dashboard');
        return { success: true };
      }
      setLoading(false);
      return { success: false, error: 'Firebase is not configured and demo user was not found.' };
    }
  };

  // ── Signup with Email / Password ──────────────────────────────────────────────
  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'admin',
    hospitalId: string = 'hospital_001'
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim();
    const auth = getFirebaseAuth();

    if (auth) {
      try {
        const { createUserWithEmailAndPassword, updateProfile: updateFirebaseProfile } = await import('firebase/auth');
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        
        if (name) {
          await updateFirebaseProfile(cred.user, { displayName: name });
        }

        const newProfile: UserProfile = {
          uid: cred.user.uid,
          name,
          email: cleanEmail,
          phone: '',
          role,
          hospitalId,
          department: role === 'doctor' ? 'General Medicine' : role === 'admin' ? 'Administration' : 'Front Desk',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const db = getFirebaseDb();
        if (db) {
          const { doc, setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', cred.user.uid), newProfile);
        }

        storageService.upsertUser(newProfile);
        setProfile(newProfile);
        setHospital(storageService.getHospitalById(hospitalId) || null);

        storageService.logAudit(
          hospitalId, 'USER_REGISTERED', 'user', cred.user.uid,
          `Firebase Auth: New account registered for ${name} (${cleanEmail})`, newProfile
        );

        setLoading(false);
        router.push('/dashboard');
        return { success: true };
      } catch (err: unknown) {
        setLoading(false);
        const code = (err as { code?: string })?.code ?? '';
        if (code === 'auth/email-already-in-use') {
          return { success: false, error: 'This email is already registered. Please sign in instead.' };
        }
        if (code === 'auth/weak-password') {
          return { success: false, error: 'Password should be at least 6 characters long.' };
        }
        if (code === 'auth/invalid-email') {
          return { success: false, error: 'Please enter a valid email address.' };
        }
        return { success: false, error: (err as { message?: string })?.message || 'Registration failed.' };
      }
    } else {
      // Demo mode signup
      const id = `USR-${Date.now()}`;
      const newProfile: UserProfile = {
        uid: id,
        name,
        email: cleanEmail,
        phone: '',
        role,
        hospitalId,
        department: 'General',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storageService.upsertUser(newProfile);
      storageService.setActiveSessionUid(id);
      setProfile(newProfile);
      setHospital(storageService.getHospitalById(hospitalId) || null);
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
    } else {
      storageService.setActiveSessionUid(null);
      clearProfile();
    }
    router.push('/login');
  };

  // ── Demo Account Switcher ─────────────────────────────────────────────────────
  const DEMO_PASSWORD = 'password123';

  const switchDemoAccount = async (email: string): Promise<void> => {
    const auth = getFirebaseAuth();

    if (auth) {
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const credential = await signInWithEmailAndPassword(auth, email, DEMO_PASSWORD);
        await fetchAndSetProfile(credential.user.uid, credential.user.email, credential.user.displayName);
        storageService.logAudit('', 'DEMO_ACCOUNT_SWITCH', 'user', credential.user.uid, `Firebase: Switched to ${email}`, undefined);
      } catch (err) {
        // Fallback: sync via local storage
        const user = storageService.getUserByEmail(email);
        if (user) {
          storageService.setActiveSessionUid(user.uid);
          setProfile(user);
          setHospital(storageService.getHospitalById(user.hospitalId) || null);
        }
      }
    } else {
      const user = storageService.getUserByEmail(email);
      if (user) {
        storageService.setActiveSessionUid(user.uid);
        setProfile(user);
        setHospital(storageService.getHospitalById(user.hospitalId) || null);
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
        loginWithGoogle,
        signup,
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
