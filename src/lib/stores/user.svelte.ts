/**
 * User store for managing user authentication and profile data
 */
import { browser } from '$app/environment';

interface UserStore {
  // Authentication state
  authInitialized: boolean; // True when auth service has completed initialization
  authType: 'guest' | 'google' | null;
  isLoggedIn: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiry: number | null; // Unix timestamp in milliseconds
  refreshTokenExpiry: number | null; // Unix timestamp in milliseconds

  // Profile data
  accountId: string | null;
  profileId: string | null;
  email: string | null;
  name: string | null;
  profileImage: string | null;

  // Onboarding data
  gender: 'male' | 'female' | null;
  bodyType: string | null;
  ethnicity: string[];
  age: number | null;
  selfieUrl: string | null;

  // Device/session data
  deviceId: string;
}

// Generate a unique device ID if not exists
function getOrCreateDeviceId(): string {
  const DEVICE_ID_KEY = 'ai_influencer_device_id';

  if (!browser) {
    return '';
  }

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  // Persist to cookie so SSR (+layout.server.ts) can read it for guest personalization.
  // Written here (module init) so it's available before any auth flow runs.
  const maxAge = 365 * 24 * 60 * 60; // 1 year
  document.cookie = `ai_influencer_device_id=${encodeURIComponent(deviceId)};path=/;max-age=${maxAge};SameSite=Lax`;

  return deviceId;
}

// Create the reactive store
export const userStore = $state<UserStore>({
  // Authentication state
  authInitialized: false,
  authType: null,
  isLoggedIn: false,
  accessToken: null,
  refreshToken: null,
  accessTokenExpiry: null,
  refreshTokenExpiry: null,

  // Profile data
  accountId: null,
  profileId: null,
  email: null,
  name: null,
  profileImage: null,

  // Onboarding data
  gender: null,
  bodyType: null,
  ethnicity: [],
  age: null,
  selfieUrl: null,

  // Device/session data
  deviceId: getOrCreateDeviceId(),
});

// Helper functions
export function setUserProfile(profile: Partial<UserStore>) {
  Object.assign(userStore, profile);
}

export function setAuthTokens(
  accessToken: string,
  refreshToken: string,
  accessTokenExpiry?: number,
  refreshTokenExpiry?: number
) {
  userStore.authType = 'google';
  userStore.accessToken = accessToken;
  userStore.refreshToken = refreshToken;
  userStore.accessTokenExpiry = accessTokenExpiry || null;
  userStore.refreshTokenExpiry = refreshTokenExpiry || null;
  userStore.isLoggedIn = true;
  setAuthInitialized();
}

export function setGuestAuth(guestToken: string, expiresIn?: number, userId?: string) {
  userStore.authType = 'guest';
  userStore.accessToken = guestToken;
  // Set expiry: current time + expiresIn seconds (converted to milliseconds)
  userStore.accessTokenExpiry = expiresIn ? Date.now() + expiresIn * 1000 : null;
  // Set guest userId for analytics
  if (userId) {
    userStore.accountId = userId;
  }
  setAuthInitialized();
  // DO NOT set isLoggedIn = true for guest tokens
}

// Promise that resolves once auth initialization completes (guest or Google).
// Any module can `await authReady` to safely defer work until a token is available.
let authReadyResolve: () => void;
export const authReady = new Promise<void>((r) => {
  authReadyResolve = r;
});

export function setAuthInitialized() {
  userStore.authInitialized = true;
  authReadyResolve();
}

export function clearAuth() {
  userStore.authInitialized = false;
  userStore.authType = null;
  userStore.isLoggedIn = false;
  userStore.accessToken = null;
  userStore.refreshToken = null;
  userStore.accessTokenExpiry = null;
  userStore.refreshTokenExpiry = null;
  userStore.accountId = null;
  userStore.profileId = null;
  userStore.email = null;
  userStore.name = null;
  userStore.profileImage = null;
  userStore.gender = null;
  userStore.bodyType = null;
  userStore.ethnicity = [];
  userStore.age = null;
  userStore.selfieUrl = null;
  // deviceId intentionally preserved — it's device-level, not user-level
}

export function setOnboardingData(data: {
  gender?: 'male' | 'female';
  bodyType?: string;
  ethnicity?: string[];
  age?: number;
  selfieUrl?: string;
}) {
  if (data.gender) userStore.gender = data.gender;
  if (data.bodyType) userStore.bodyType = data.bodyType;
  if (data.ethnicity) userStore.ethnicity = data.ethnicity;
  if (data.age) userStore.age = data.age;
  if (data.selfieUrl) userStore.selfieUrl = data.selfieUrl;
}

// --- Single-blob localStorage sync ---
// The store is the source of truth. This $effect auto-persists all profile/onboarding
// fields as one JSON blob whenever any of them change. Auth tokens and deviceId are
// managed separately (tokens by auth.ts, deviceId above).
import { USER_STORAGE_KEY } from '$lib/constants/storage';

// Fields to persist (excludes auth tokens, isLoggedIn, authType, authInitialized, deviceId).
// getPersistedSnapshot() is the single source of truth for which fields are persisted —
// the hydration block below derives its field list from this function's keys.
function getPersistedSnapshot() {
  return {
    accountId: userStore.accountId,
    profileId: userStore.profileId,
    email: userStore.email,
    name: userStore.name,
    profileImage: userStore.profileImage,
    gender: userStore.gender,
    bodyType: userStore.bodyType,
    ethnicity: userStore.ethnicity,
    age: userStore.age,
    selfieUrl: userStore.selfieUrl,
  };
}

$effect.root(() => {
  $effect(() => {
    if (!browser) return;
    const snapshot = getPersistedSnapshot();
    // After clearAuth(), all profile fields are null — don't persist empty state.
    // This prevents the $effect from re-writing a null blob after logout.
    if (snapshot.accountId != null || snapshot.profileId != null) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  });
});

// Hydrate store from localStorage on initialization.
// Field list driven by getPersistedSnapshot() keys — adding a field there auto-includes it here.
if (browser) {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const keys = Object.keys(getPersistedSnapshot()) as (keyof ReturnType<
        typeof getPersistedSnapshot
      >)[];
      for (const key of keys) {
        const val = data[key];
        if (val != null && !(Array.isArray(val) && val.length === 0)) {
          (userStore as unknown as Record<string, unknown>)[key] = val;
        }
      }
    }
  } catch {
    // Ignore malformed persisted data
  }

  // Restore locally-uploaded selfie (set during onboarding bypass).
  // Blob URLs die on refresh, but we stored the data URL under a separate key.
  try {
    const localSelfie = localStorage.getItem('ai_influencer_local_selfie');
    if (localSelfie && !userStore.profileImage) {
      userStore.profileImage = localSelfie;
    }
  } catch {
    // Ignore
  }
}
