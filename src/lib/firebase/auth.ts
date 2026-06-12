/**
 * Firebase Authentication service
 *
 * Provides custom token authentication for chat functionality.
 * Token is obtained from the backend API.
 */
import {
  signInWithCustomToken as firebaseSignInWithCustomToken,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { getAuthInstance, isFirebaseAvailable } from './index';
import * as Sentry from '@sentry/sveltekit';
import type { FirebaseUser } from '$lib/types';

/**
 * Sign in with a custom token from the backend
 * Returns the user if successful, null otherwise
 */
export async function signInWithCustomToken(token: string): Promise<FirebaseUser | null> {
  const auth = getAuthInstance();
  if (!auth) {
    return null;
  }

  try {
    const result = await firebaseSignInWithCustomToken(auth, token);
    return {
      uid: result.user.uid,
      isAnonymous: result.user.isAnonymous,
    };
  } catch (error) {
    console.error('[Auth] Sign-in failed:', error);
    Sentry.captureException(error, { tags: { operation: 'firebase_custom_token_signin' } });
    return null;
  }
}

/**
 * Wait for Firebase auth state to be resolved after page load.
 * Firebase restores auth from IndexedDB asynchronously — auth.currentUser
 * is null synchronously on refresh. This waits for the first
 * onAuthStateChanged callback, which fires once with the restored user
 * (or null if genuinely not authenticated).
 *
 * Concurrent callers share the same pending promise.
 * Times out after 5 seconds (auth restoration is local/IndexedDB, not network-bound,
 * but slow devices or corrupted storage could delay it).
 */
const AUTH_READY_TIMEOUT_MS = 5000;
const GET_ID_TOKEN_TIMEOUT_MS = 10000;
let authReadyPromise: Promise<FirebaseUser | null> | null = null;

/**
 * Call getIdToken() with a timeout. If the token refresh network call hangs
 * (e.g. Firebase auth servers unreachable), this resolves with null after
 * GET_ID_TOKEN_TIMEOUT_MS so the caller can fall back to initConversation.
 */
function getIdTokenWithTimeout(user: User): Promise<string | null> {
  return Promise.race([
    user.getIdToken(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), GET_ID_TOKEN_TIMEOUT_MS)),
  ]);
}

export function waitForAuthReady(): Promise<FirebaseUser | null> {
  const auth = getAuthInstance();
  if (!auth) {
    return Promise.resolve(null);
  }

  // If currentUser is already set, auth state is resolved.
  // Still call getIdToken() to ensure the token is fresh before the caller subscribes.
  // If the refresh fails or times out, resolve with null so the caller falls back to
  // fetching a fresh token via initConversation.
  if (auth.currentUser) {
    const currentUser = auth.currentUser;
    return getIdTokenWithTimeout(currentUser)
      .then((token) => (token ? { uid: currentUser.uid, isAnonymous: currentUser.isAnonymous } : null))
      .catch(() => null);
  }

  // Share a single pending promise across concurrent callers
  if (authReadyPromise) {
    return authReadyPromise;
  }

  authReadyPromise = new Promise<FirebaseUser | null>((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, AUTH_READY_TIMEOUT_MS);

    const unsubscribe = firebaseOnAuthStateChanged(auth, (user: User | null) => {
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        // Ensure the ID token is fresh before resolving — on page refresh Firebase
        // fires onAuthStateChanged before completing the background token refresh.
        // If refresh times out or fails, resolve with null so the caller gets a fresh token.
        getIdTokenWithTimeout(user)
          .then((token) => resolve(token ? { uid: user.uid, isAnonymous: user.isAnonymous } : null))
          .catch(() => resolve(null));
      } else {
        resolve(null);
      }
    });
  });

  // Clear memoization after the promise settles. Using .then() ensures this
  // runs after the outer assignment, even if the callback fires synchronously.
  authReadyPromise.then(() => {
    authReadyPromise = null;
  });

  return authReadyPromise;
}

/**
 * Listen for auth state changes
 * Returns unsubscribe function
 */
export function onAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe | null {
  const auth = getAuthInstance();
  if (!auth) {
    callback(null);
    return null;
  }

  return firebaseOnAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        isAnonymous: user.isAnonymous,
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  const auth = getAuthInstance();
  if (!auth) {
    return;
  }

  try {
    await firebaseSignOut(auth);
  } catch {
    // Sign out failed silently
  }
}

/**
 * Check if Firebase auth is available
 */
export function isAuthAvailable(): boolean {
  return isFirebaseAvailable() && getAuthInstance() !== null;
}
