/**
 * Authentication state store using Svelte 5 runes
 *
 * Manages Firebase authentication state with automatic anonymous sign-in
 * when Firebase is enabled.
 */
import { browser } from '$app/environment';
import type { FirebaseUser } from '$lib/types';
import { FIREBASE_ENABLED } from '$lib/firebase/config';

// Auth state using Svelte 5 runes
let user = $state<FirebaseUser | null>(null);
let loading = $state(true);
let error = $state<string | null>(null);
let initialized = $state(false);
let authUnsubscribe: (() => void) | null = null;

/**
 * Initialize authentication
 * This should be called once when the app starts
 */
async function initAuth(): Promise<void> {
  if (!browser || initialized) {
    return;
  }

  if (!FIREBASE_ENABLED) {
    // Generate a local user ID for fallback mode
    user = {
      uid: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      isAnonymous: true,
    };
    loading = false;
    initialized = true;
    return;
  }

  try {
    // Dynamic import to avoid loading Firebase when disabled
    const { onAuthStateChanged } = await import('$lib/firebase/auth');

    // Listen for auth state changes (auth happens via custom token in chat init)
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      user = firebaseUser;
      loading = false;
    });

    loading = false;
    initialized = true;

    // Store cleanup function for potential future use
    authUnsubscribe = unsubscribe;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to initialize authentication';
    loading = false;
    initialized = true;
  }
}

/**
 * Sign out the current user
 */
async function signOutUser(): Promise<void> {
  if (!FIREBASE_ENABLED) {
    user = null;
    return;
  }

  try {
    const { signOut } = await import('$lib/firebase/auth');
    await signOut();
    user = null;
  } catch (err) {
    console.warn('Sign out failed:', err);
  }
}

/**
 * Get current user ID (works in both Firebase and fallback mode)
 */
function getUserId(): string | null {
  return user?.uid ?? null;
}

/**
 * Cleanup auth listeners
 */
function cleanup(): void {
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
}

// Export the auth store
export const authStore = {
  get user() {
    return user;
  },
  get loading() {
    return loading;
  },
  get error() {
    return error;
  },
  get initialized() {
    return initialized;
  },
  get isAuthenticated() {
    return user !== null;
  },
  init: initAuth,
  signOut: signOutUser,
  getUserId,
  cleanup,
};
