// MedFlow AI CRM — Firebase Configuration & Storage Bridge
// Provides seamless connection to Firebase when keys are present in .env.local,
// while gracefully managing local persistent state for out-of-the-box operation.

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'medflow-ai-crm-demo',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

export interface FirestoreServiceStatus {
  isConfigured: boolean;
  projectId: string;
  mode: 'cloud-firestore' | 'reactive-local-storage';
}

export function getBackendStatus(): FirestoreServiceStatus {
  return {
    isConfigured: isFirebaseConfigured,
    projectId: firebaseConfig.projectId,
    mode: isFirebaseConfigured ? 'cloud-firestore' : 'reactive-local-storage',
  };
}
