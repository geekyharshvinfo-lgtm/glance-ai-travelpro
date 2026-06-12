/**
 * Firebase app initialization with lazy loading
 *
 * Firebase is only initialized when first accessed, reducing bundle impact
 * when FIREBASE_ENABLED is false.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { firebaseConfig, FIREBASE_ENABLED } from './config';
import * as Sentry from '@sentry/sveltekit';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let initializationError: Error | null = null;

/**
 * Initialize Firebase app lazily
 * Returns null if Firebase is disabled or initialization fails
 */
function initializeFirebase(): FirebaseApp | null {
  if (!FIREBASE_ENABLED) {
    return null;
  }

  if (app) {
    return app;
  }

  if (initializationError) {
    return null;
  }

  try {
    app = initializeApp(firebaseConfig);
    return app;
  } catch (error) {
    initializationError =
      error instanceof Error ? error : new Error('Failed to initialize Firebase');
    console.warn('Firebase initialization failed:', initializationError.message);
    Sentry.captureException(initializationError, { tags: { operation: 'firebase_init' } });
    return null;
  }
}

/**
 * Get Firestore instance
 * Returns null if Firebase is disabled or not initialized
 */
export function getFirestoreInstance(): Firestore | null {
  if (db) {
    return db;
  }

  const firebaseApp = initializeFirebase();
  if (!firebaseApp) {
    return null;
  }

  try {
    db = getFirestore(firebaseApp);
    return db;
  } catch (error) {
    console.warn('Failed to get Firestore instance:', error);
    Sentry.captureException(error, { tags: { operation: 'firestore_init' } });
    return null;
  }
}

/**
 * Get Auth instance
 * Returns null if Firebase is disabled or not initialized
 */
export function getAuthInstance(): Auth | null {
  if (auth) {
    return auth;
  }

  const firebaseApp = initializeFirebase();
  if (!firebaseApp) {
    return null;
  }

  try {
    auth = getAuth(firebaseApp);
    return auth;
  } catch (error) {
    console.warn('Failed to get Auth instance:', error);
    Sentry.captureException(error, { tags: { operation: 'firebase_auth_init' } });
    return null;
  }
}

/**
 * Check if Firebase is available and enabled
 */
export function isFirebaseAvailable(): boolean {
  return FIREBASE_ENABLED && initializeFirebase() !== null;
}

/**
 * Get initialization error if any
 */
export function getInitializationError(): Error | null {
  return initializationError;
}
