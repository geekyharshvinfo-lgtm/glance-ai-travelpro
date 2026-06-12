import type { AnalyticsEventActionType, EventData, TrackingConfig, CustomContext } from '$lib/types/analytics';
import { ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PERFORMANCE_EVENT_ACTIONS } from '$lib/constants/analytics';
import { SENTINEL_CONFIG } from '$lib/config/env';
import { userStore } from '$lib/stores/user.svelte';

/**
 * Queue to store events before Sentinel is loaded
 */
let pendingEvents: Array<[AnalyticsEventActionType, EventData, number]> = [];

/**
 * Removes undefined and null values from an object recursively
 */
function removeNullAndUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      if (Object.prototype.toString.call(value) === '[object Object]') {
        const cleanedNested = removeNullAndUndefined(value as Record<string, unknown>);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
}

/**
 * Get base analytics data (can be extended with user/device info)
 */
export function getAnalyticsData() {
  return {
    time: Date.now(),
    eventName: 'ai_embed_pwa',
    url: typeof window !== 'undefined' ? window.location.href : '',
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    userInfo: {
      userId: userStore.accountId || '',
      profileId: userStore.profileId || '',
      email: userStore.email || '',
      name: userStore.name || '',
      gender: userStore.gender || '',
      age: userStore.age || null,
    },
    userAuth: {
      isLoggedIn: userStore.isLoggedIn,
      authType: userStore.authType,
    }
  };
}

/**
 * Helper function to generate data-sentinel attribute value
 */
export const getSentinelData = (
  trackConfig: TrackingConfig,
  pageName: string,
  additionalData: Record<string, unknown> = {}
): string => {
  const sentinelData: Record<string, unknown> = {
    ...getAnalyticsData(),
    ...additionalData,
    track: trackConfig,
    pageName
  };

  try {
    return JSON.stringify(removeNullAndUndefined(sentinelData));
  } catch (error) {
    console.error('Failed to stringify sentinel data:', error);
    return '';
  }
};

/**
 * Track an event using the Sentinel analytics system
 */
export function trackEvent(eventName: AnalyticsEventActionType, trackingData: EventData): void {
  if (!window.Sentinel) {
    console.warn('Sentinel tracking not available, queuing event');
    pendingEvents.push([eventName, trackingData, Date.now()]);
    return;
  }

  try {
    const finalTrackingData = {
      ...getAnalyticsData(),
      ...trackingData
    };

    console.log('Tracking event:', eventName, finalTrackingData);
    
    const cleanedTrackingData = removeNullAndUndefined(finalTrackingData);
    window.Sentinel.trackEvent(eventName, cleanedTrackingData);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Process any events that were queued before Sentinel loaded
 */
export function processPendingEvents(): void {
  if (!window.Sentinel || pendingEvents.length === 0) return;

  console.log(`Processing ${pendingEvents.length} pending analytics events`);
  
  pendingEvents.forEach(([eventName, trackingData, timestamp]) => {
    trackEvent(eventName, { ...trackingData, queuedAt: timestamp });
  });

  pendingEvents = [];
}

/**
 * Dynamically load a script
 */
function loadScript(src: string, options: { defer?: boolean; async?: boolean } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = options.defer ?? false;
    script.async = options.async ?? false;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.head.appendChild(script);
  });
}

/**
 * Update Sentinel userId dynamically (e.g., after login)
 */
export function updateSentinelUserId(userId: string): void {
  if (typeof window === 'undefined') return;
  
  if (window.Sentinel?.config) {
    window.Sentinel.config.userId = userId;
  }
}

/**
 * Load and initialize Sentinel analytics
 */
export function loadSentinel(customContext?: CustomContext): void {
  if (typeof window === 'undefined') return;

  // Create custom context with page metadata
  const context: CustomContext = {
    pageName: customContext?.pageName || '',
    url: window.location.href,
    referrer: document.referrer,
    extras: {
      userAgent: navigator.userAgent,
      ...customContext?.extras
    }
  };

  // Initialize Sentinel configuration on window
  (function (w: any) {
    const queue: any[] = [];
    w.Sentinel = {
      config: {
        endpoint: SENTINEL_CONFIG.ENDPOINT,
        apiKey: SENTINEL_CONFIG.API_KEY,
        app: SENTINEL_CONFIG.APP_NAME,
        userId: userStore?.deviceId || '', // Initialize with current userId if available
        autoTrack: {
          clicks: true,
          errors: true,
          performance: true,
          scrolling: true,
          swipes: false,
          visibility: true,
          ping: false
        },
        firstBatchDelay: 3000,
        batchSize: 10,
        customContext: Object.keys(context).length > 0 ? context : undefined
      },
      _q: queue,
      trackEvent: function (action: AnalyticsEventActionType, data: EventData) {
        queue.push([action, data, Date.now()]);
      }
    };
  })(window);

  // Load Sentinel script
  loadScript('https://trends.glance.com/sentinel/version/sentinel-v0.0.52.js', { defer: true })
    .then(() => {
      console.log('Sentinel analytics loaded successfully');
      trackEvent(AnalyticsEventAction.RENDERED, {
        [ANALYTICS_EVENT_KEYS.action]: PERFORMANCE_EVENT_ACTIONS.SENTINEL_LOADED,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PERFORMANCE
      });
      processPendingEvents();
    })
    .catch((error) => {
      console.error('Failed to load Sentinel:', error);
      trackEvent(AnalyticsEventAction.RENDERED, {
        [ANALYTICS_EVENT_KEYS.action]: PERFORMANCE_EVENT_ACTIONS.SENTINEL_ERROR,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.ERROR
      });
    });
}
