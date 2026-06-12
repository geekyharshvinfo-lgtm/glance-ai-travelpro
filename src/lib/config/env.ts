/**
 * Environment configuration
 * Centralizes all environment variables and provides type-safe access.
 * All values are sourced from env files (.env, .uat.env, .prod.env)
 * via the generated runtime-env.ts.
 */
import { env as runtimeEnv } from './runtime-env';

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: runtimeEnv.PUBLIC_FIREBASE_API_KEY || '',
  authDomain: runtimeEnv.PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: runtimeEnv.PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: runtimeEnv.PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: runtimeEnv.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: runtimeEnv.PUBLIC_FIREBASE_APP_ID || '',
};

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = runtimeEnv.PUBLIC_GOOGLE_CLIENT_ID || '';

// Auth client ID for API calls (different from OAuth client ID)
export const AUTH_CLIENT_ID = runtimeEnv.PUBLIC_AUTH_CLIENT_ID || '';

// API Endpoints
export const API_ENDPOINTS = {
  GLANCE_ACCOUNT: runtimeEnv.PUBLIC_GLANCE_ACCOUNT_API_URL || '',
  BIFROST: runtimeEnv.PUBLIC_BIFROST_API_URL || '',
  AI_INFLUENCER_BACKEND: runtimeEnv.PUBLIC_AI_INFLUENCER_BACKEND_URL || '',
  STAGING_CDN: runtimeEnv.PUBLIC_STAGING_CDN || '',
  IMAGE_CDN: runtimeEnv.PUBLIC_IMAGE_CDN || '',
};

// CDN Image Resizer
export const CDN_RESIZER_BASE = runtimeEnv.PUBLIC_CDN_RESIZER_BASE || '';

// Sentinel Analytics Configuration
export const SENTINEL_CONFIG = {
  ENDPOINT:
    runtimeEnv.PUBLIC_SENTINEL_ENDPOINT ||
    'https://staging.analytics.glance.inmobi.com/api/v2/analytics/web/log',
  API_KEY: runtimeEnv.PUBLIC_SENTINEL_API_KEY || '',
  APP_NAME: 'ai_embed_pwa',
};

// Sentry
export const SENTRY_DSN = runtimeEnv.PUBLIC_SENTRY_DSN || '';
export const SENTRY_ENVIRONMENT = runtimeEnv.PUBLIC_SENTRY_ENVIRONMENT || 'development';

// Check if Firebase is properly configured
export const FIREBASE_ENABLED = Boolean(
  FIREBASE_CONFIG.apiKey &&
  FIREBASE_CONFIG.authDomain &&
  FIREBASE_CONFIG.projectId &&
  FIREBASE_CONFIG.appId
);

// Feature flags
// Set to true to re-enable mandatory Google login gates (try-on, chat style-me, selfie upload).
// When false, guest users can perform try-on after onboarding without signing in
export const LOGIN_REQUIRED = false;

// Tryon Timer
export const TOTAL_TIME_FOR_TRYON = 180; // 3 minutes in seconds

// Chat Session Restore Duration
export const CHAT_SESSION_RESTORE_TIME = parseFloat(runtimeEnv.PUBLIC_CHAT_SESSION_RESTORE_TIME || '86400'); // Default to 24 hours in seconds
