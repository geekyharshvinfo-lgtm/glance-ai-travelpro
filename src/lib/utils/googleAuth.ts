/**
 * Google Authentication Utility
 *
 * Provides reusable Google login functionality across components.
 * The GSI script is loaded on-demand when login is first triggered,
 * avoiding an ~80 KB download on every page load.
 *
 * In-app browser handling (Instagram, Facebook, TikTok, etc.):
 *   - Android WebView: Uses GSI redirect mode (full-page navigate → Google → back to /)
 *   - iOS WebView:     Uses GSI redirect mode (same flow)
 *   - Normal browser:  Uses GSI popup mode (existing behaviour preserved)
 */

import { authService } from '$lib/services/auth';
import { loginStore } from '$lib/stores/login.svelte';
import { GOOGLE_CLIENT_ID } from '$lib/config/env';
import {
  saveLoginIntent,
  consumePendingLoginAction,
  type LoginIntentAction,
} from '$lib/services/loginIntent';
import { trackEvent } from '$lib/utils/analytics';
import {
  ACTION_TYPES,
  ANALYTICS_EVENT_KEYS,
  AnalyticsEventAction,
  EVENT_TYPES,
  PAGE_NAMES,
} from '$lib/constants/analytics';
import * as Sentry from '@sentry/sveltekit';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GoogleOAuth2Config {
  client_id: string;
  scope: string;
  ux_mode: 'popup' | 'redirect';
  callback: (response: { code: string }) => void;
  redirect_uri: string;
  error_callback: (error: { type: string; message: string }) => void;
}

interface GoogleAuthClient {
  requestCode: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initCodeClient: (config: GoogleOAuth2Config) => GoogleAuthClient;
        };
      };
    };
  }
}

// ---------------------------------------------------------------------------
// In-app WebView detection
// ---------------------------------------------------------------------------

/** User-agent patterns for social-media in-app browsers */
const IN_APP_BROWSER_RE = /Instagram|FBAV|FBAN|FB_IAB|TikTok|BytedanceWebview|Snapchat/i;
const ANDROID_RE = /android/i;
const IOS_RE = /iPhone|iPad|iPod/i;

export function isInAppWebView(): boolean {
  const ua = navigator.userAgent;
  return IN_APP_BROWSER_RE.test(ua) && (ANDROID_RE.test(ua) || IOS_RE.test(ua));
}

function isAndroidInAppWebView(): boolean {
  const ua = navigator.userAgent;
  return IN_APP_BROWSER_RE.test(ua) && ANDROID_RE.test(ua);
}

// ---------------------------------------------------------------------------
// GSI script loading
// ---------------------------------------------------------------------------

let gsiLoadPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiLoadPromise) return gsiLoadPromise;

  gsiLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gsiLoadPromise = null;
      reject(new Error('Failed to load Google OAuth library'));
    };
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
}

// ---------------------------------------------------------------------------
// GSI client — popup mode (normal browsers)
// ---------------------------------------------------------------------------

let popupClient: GoogleAuthClient | null = null;

function getPopupClient(): GoogleAuthClient | null {
  if (popupClient) return popupClient;
  if (!window.google?.accounts?.oauth2) return null;

  popupClient = window.google.accounts.oauth2.initCodeClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'openid profile email',
    ux_mode: 'popup',
    redirect_uri: window.location.origin,
    callback: handlePopupAuthCode,
    error_callback: handlePopupError,
  });

  return popupClient;
}

async function handlePopupAuthCode(response: { code: string }) {
  loginStore.loginInProgress = true;
  try {
    await authService.loginWithGlance(response.code, window.location.origin);
  } catch (error) {
    Sentry.captureException(error, { tags: { operation: 'google_auth_code' } });
    loginStore.error = 'Something went wrong. Please try again.';
    loginStore.loginInProgress = false;
  }
}

function handlePopupError(error: { type: string; message: string }) {
  trackEvent(AnalyticsEventAction.CLICKED, {
    [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
    [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_LOGIN_FAILED,
    [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.AUTH_PAGE,
    [ANALYTICS_EVENT_KEYS.loginMethod]: 'google',
    [ANALYTICS_EVENT_KEYS.loginStatus]: 'failed',
    [ANALYTICS_EVENT_KEYS.errorMessage]: error?.message || 'OAuth error',
    [ANALYTICS_EVENT_KEYS.label]: 'google_oauth_error',
  });

  Sentry.captureException(error, { tags: { operation: 'google_oauth_callback' } });
  loginStore.loginInProgress = false;
  loginStore.error = error?.message || 'Authentication failed. Please try again.';
}

// ---------------------------------------------------------------------------
// GSI client — redirect mode (in-app WebViews)
// ---------------------------------------------------------------------------

let redirectClient: GoogleAuthClient | null = null;

function getRedirectClient(): GoogleAuthClient | null {
  if (redirectClient) return redirectClient;
  if (!window.google?.accounts?.oauth2) return null;

  redirectClient = window.google.accounts.oauth2.initCodeClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'openid profile email',
    ux_mode: 'redirect',
    redirect_uri: window.location.origin,
    // In redirect mode, callback fires only if the redirect is to the same
    // page. We handle the code in the root route's load, so this is a no-op.
    callback: () => {},
    error_callback: handlePopupError,
  });

  return redirectClient;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Trigger Google Sign-In.
 *
 * In normal browsers, opens the standard GSI popup.
 * In in-app WebViews, saves the current page context as a loginIntent and
 * uses GSI redirect mode so the full-page navigation works within the
 * WebView's constraints.
 *
 * @param intentAction Optional deferred action to resume after login
 *   (e.g., try-on item, pending chat message). Callers that trigger login
 *   from a user action should pass the relevant intent.
 */
export async function triggerGoogleLogin(intentAction?: LoginIntentAction): Promise<void> {
  loginStore.error = null;

  // Track login initiated
  trackEvent(AnalyticsEventAction.CLICKED, {
    [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
    [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_LOGIN_INITIATED,
    [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.AUTH_PAGE,
    [ANALYTICS_EVENT_KEYS.loginMethod]: 'google',
    [ANALYTICS_EVENT_KEYS.label]: 'google_login_initiated',
  });

  // Todo remove force_redirect param after we confirm the redirect flow is stable in all in-app browsers
  const useRedirect =
    isInAppWebView() ||
    new URLSearchParams(window.location.search).has('force_redirect');

  // For redirect flow, persist context before navigating away.
  // Merge explicit intentAction with any pending action set by the calling
  // code (e.g., useTryOn sets a pending action before showLoginPopup).
  if (useRedirect) {
    const action = intentAction ?? consumePendingLoginAction();
    saveLoginIntent(window.location.pathname + window.location.search, action);
  }

  loginStore.loginInProgress = true;

  try {
    await loadGsiScript();

    const client = useRedirect ? getRedirectClient() : getPopupClient();

    if (!client) {
      loginStore.loginInProgress = false;
      loginStore.error = 'Google authentication service not available';

      // Android in-app: fallback to opening in system browser
      if (isAndroidInAppWebView()) {
        openInExternalBrowser(window.location.href);
      }
      return;
    }

    client.requestCode();

    // In redirect mode the page navigates away — if it doesn't within 3s
    // (e.g., user closes the Google page) reset the spinner.
    if (useRedirect) {
      setTimeout(() => {
        loginStore.loginInProgress = false;
      }, 3000);
    }
  } catch (error) {
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_LOGIN_FAILED,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.AUTH_PAGE,
      [ANALYTICS_EVENT_KEYS.loginMethod]: 'google',
      [ANALYTICS_EVENT_KEYS.loginStatus]: 'failed',
      [ANALYTICS_EVENT_KEYS.errorMessage]:
        error instanceof Error ? error.message : 'GSI load failed',
      [ANALYTICS_EVENT_KEYS.label]: 'google_gsi_load_failed',
    });

    Sentry.captureException(error, { tags: { operation: 'google_auth_load' } });
    loginStore.loginInProgress = false;
    loginStore.error = 'Google authentication service not available. Please try again.';

    // Android in-app: last-resort fallback to system browser
    if (isAndroidInAppWebView()) {
      openInExternalBrowser(window.location.href);
    }
  }
}

/**
 * Open the given URL in the device's default browser via Android intent:// scheme.
 * Used as a last-resort fallback when GSI itself fails to load in a WebView.
 */
function openInExternalBrowser(url: string): void {
  const cleanUrl = url.split('#')[0];
  const stripped = cleanUrl.replace(/^https?:\/\//, '');
  window.location.href = `intent://${stripped}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
}

/**
 * Check if Google Auth is available
 */
export function isGoogleAuthAvailable(): boolean {
  return !!window.google?.accounts?.oauth2;
}

/**
 * Reset Google Auth clients (useful for testing or cleanup)
 */
export function resetGoogleAuthClient(): void {
  popupClient = null;
  redirectClient = null;
}
