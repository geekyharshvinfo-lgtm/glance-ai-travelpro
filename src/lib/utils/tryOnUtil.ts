/**
 * Try-On Utility
 * Provides reusable try-on functionality across components
 */

import { userStore } from '$lib/stores/user.svelte';
import { showLoginPopup } from '$lib/stores/login.svelte';
import { startOnboarding, setOnboardingStep } from '$lib/stores/onboarding.svelte';
import { LOGIN_REQUIRED } from '$lib/config/env';
import { browser } from '$app/environment';
import * as Sentry from '@sentry/sveltekit';
import { trackEvent } from './analytics';
import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES } from '$lib/constants/analytics';

export interface TryOnResult {
  success: boolean;
  needsLogin?: boolean;
  needsOnboarding?: boolean;
  imageUrl?: string;
  error?: string;
  jobId?: string;
}

export interface TryOnItem {
  id: string;
  image: string;
  name: string;
  type?: string;
  brandPersona?: string;
}

/**
 * Initiate try-on process for an item
 * Handles authentication checks and API calls
 * Returns result that components can use to update their UI
 */
export async function checkUserAuth(item: TryOnItem, _influencerId: string): Promise<TryOnResult> {
  console.log('Style Me clicked for:', item);

  // When login is required and user has no selfie yet, show popup with skip option.
  // If they already uploaded a selfie as guest, skip straight to try-on.
  if (LOGIN_REQUIRED && !userStore.isLoggedIn) {
    if (userStore.profileImage) {
      // Guest with selfie — allow try-on without re-prompting login
      return { success: true };
    }
    showLoginPopup({ allowSkip: true });
    return {
      success: false,
      needsLogin: true,
    };
  }

  console.log('Login skipped');

  // No selfie yet — show onboarding (works for both guest and logged-in users)
  if (!userStore.profileImage) {
    console.log('selfie not set');
    setOnboardingStep('selfie');
    startOnboarding();
    return {
      success: false,
      needsOnboarding: true,
    };
  }

  return {
    success: true,
  };
}

/**
 * Preload an image and return a promise that resolves when loaded
 * Useful for smooth UI transitions after try-on completion
 */
export function preloadImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Check if user can perform try-on (logged in + has selfie)
 * Useful for disabling buttons or showing different UI states
 */
export function canPerformTryOn(): boolean {
  return (!LOGIN_REQUIRED || userStore.isLoggedIn) && !!userStore.profileImage;
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function isGenderMismatch(): boolean {
  // Gender check using influencer_gender from localStorage
  let influencerGender = null;
  if (browser) {
    influencerGender = localStorage.getItem('influencer_gender');
  }
  // If login is required and user isn't logged in, or has no gender set, there's no mismatch
  if ((LOGIN_REQUIRED && !userStore.isLoggedIn) || !userStore.gender) {
    return false;
  }
  return influencerGender !== userStore.gender;
}

/**
 * Create a try-on job without polling (for persistence support)
 */
/**
 * Call local Gemini try-on endpoint and return the result image as a data URL.
 * The jobId returned is a synthetic key used by pollExistingTryOnJob to retrieve
 * the result from a module-level map (no actual polling needed).
 */
const tryOnResultCache = new Map<string, string>(); // jobId → imageDataUrl

export async function createTryOnJobOnly(
  item: TryOnItem,
  influencerId: string,
  analyticsOptions?: {
    pageName?: string;
    section?: string;
  }
): Promise<TryOnResult> {
  if (!influencerId) {
    return { success: false, error: 'Missing influencer ID' };
  }

  const selfieUrl = userStore.profileImage;
  if (!selfieUrl) {
    return { success: false, error: 'No selfie available' };
  }

  const startTime = Date.now();

  try {
    if (analyticsOptions) {
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.TRY_ON_INITIATED,
        [ANALYTICS_EVENT_KEYS.pageName]: analyticsOptions.pageName,
        [ANALYTICS_EVENT_KEYS.section]: analyticsOptions.section,
        [ANALYTICS_EVENT_KEYS.productId]: item.id,
        [ANALYTICS_EVENT_KEYS.productName]: item.name,
      });
    }

    const res = await fetch('/api/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selfieUrl,
        productImageUrl: item.image,
        productName: item.name,
        productType: item.type || '',
        gender: userStore.gender,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || `Try-on API error ${res.status}`);
    }

    // Convert base64 image to a data URL and cache under a synthetic job ID
    const imageUrl = `data:${data.mimeType};base64,${data.imageData}`;
    const jobId = `local-${item.id}-${startTime}`;
    tryOnResultCache.set(jobId, imageUrl);

    return { success: true, jobId };
  } catch (error) {
    console.error('[TryOn] createTryOnJobOnly error:', error);
    Sentry.captureException(error, { tags: { operation: 'tryon_job_creation' } });

    if (analyticsOptions) {
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.TRY_ON_FAILED,
        [ANALYTICS_EVENT_KEYS.pageName]: analyticsOptions.pageName,
        [ANALYTICS_EVENT_KEYS.section]: analyticsOptions.section,
        [ANALYTICS_EVENT_KEYS.productId]: item.id,
        [ANALYTICS_EVENT_KEYS.productName]: item.name,
        [ANALYTICS_EVENT_KEYS.errorMessage]: error instanceof Error ? error.message : 'Try-on failed',
        [ANALYTICS_EVENT_KEYS.tryOnDuration]: Date.now() - startTime,
      });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Try-on failed',
    };
  }
}

/**
 * Retrieve result for a local Gemini try-on job (no actual polling needed).
 * createTryOnJobOnly already has the result — this just reads it from cache.
 */
export async function pollExistingTryOnJob(
  jobId: string,
  signal?: AbortSignal,
  analyticsOptions?: {
    pageName?: string;
    section?: string;
    productId?: string;
    productName?: string;
  }
): Promise<TryOnResult> {
  console.log('[TryOn] Resolving local job:', jobId);
  const startTime = Date.now();

  // Local Gemini jobs have their result cached immediately after creation
  const imageUrl = tryOnResultCache.get(jobId);
  if (imageUrl) {
    tryOnResultCache.delete(jobId);
    if (analyticsOptions) {
      trackEvent(AnalyticsEventAction.RENDERED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.RENDER,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.TRY_ON_SUCCESS,
        [ANALYTICS_EVENT_KEYS.pageName]: analyticsOptions.pageName,
        [ANALYTICS_EVENT_KEYS.section]: analyticsOptions.section,
        [ANALYTICS_EVENT_KEYS.productId]: analyticsOptions.productId,
        [ANALYTICS_EVENT_KEYS.productName]: analyticsOptions.productName,
        [ANALYTICS_EVENT_KEYS.jobId]: jobId,
        [ANALYTICS_EVENT_KEYS.tryOnDuration]: Date.now() - startTime,
      });
    }
    return { success: true, imageUrl };
  }

  // Fallback — should not happen in normal flow
  console.error('[TryOn] No cached result found for jobId:', jobId);
  return { success: false, error: 'Try-on result not found' };
}
