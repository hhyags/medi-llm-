// MedFlow AI CRM — Firebase SDK Singleton Initializer
// Initializes Firebase App, Auth, and Firestore exactly once.
// Returns null for auth/db when Firebase is not configured (graceful demo fallback).

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig, isFirebaseConfigured } from './config';

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) return null;
  if (_app) return _app;
  try {
    _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return _app;
  } catch (err) {
    console.error('[MedFlow] Firebase App initialization failed:', err);
    return null;
  }
}

/**
 * Returns the Firebase Auth instance, or null if Firebase is not configured.
 * When null, the app falls back to the localStorage demo session.
 */
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured) return null;
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    _auth = getAuth(app);
    return _auth;
  } catch (err) {
    console.error('[MedFlow] Firebase Auth initialization failed:', err);
    return null;
  }
}

/**
 * Returns the Firestore instance, or null if Firebase is not configured.
 * When null, the app uses the localStorage reactive data store.
 */
export function getFirebaseDb(): Firestore | null {
  if (!isFirebaseConfigured) return null;
  if (_db) return _db;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    _db = getFirestore(app);
    return _db;
  } catch (err) {
    console.error('[MedFlow] Firestore initialization failed:', err);
    return null;
  }
}
