/**
 * Firebase configuration
 */
import { FIREBASE_CONFIG, FIREBASE_ENABLED as ENV_FIREBASE_ENABLED } from '$lib/config/env';

export const firebaseConfig = FIREBASE_CONFIG;

/**
 * Toggle to enable/disable Firebase functionality.
 * When false, the app falls back to simulated local messaging.
 */
export const FIREBASE_ENABLED = ENV_FIREBASE_ENABLED;
