/**
 * Page Tracking Composable
 * Tracks page lifecycle events similar to wallpaperart's InViewport/OutOfViewport pattern
 * 
 * Usage:
 * import { usePageTracking } from '$lib/composables/usePageTracking.svelte';
 * 
 * onMount(() => {
 *   usePageTracking({
 *     pageName: PAGE_NAMES.HOME_PAGE,
 *     section: SECTION_NAMES.HERO,
 *     metadata: { influencerId: 'xyz' }
 *   });
 * });
 */

import { onMount, onDestroy } from 'svelte';
import { browser } from '$app/environment';
import { trackEvent } from '$lib/utils/analytics';
import { ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES } from '$lib/constants/analytics';

interface PageTrackingOptions {
  pageName: string;
  section?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track page lifecycle events (mount, unmount, visibility)
 */

export function usePageTracking(options: PageTrackingOptions): void {
  if (!browser) return;

  const { pageName, section, metadata = {} } = options;

  // Local variables scoped to this component instance
  let pageStartTime: number | null = null;
  let visibilityChangeHandler: (() => void) | null = null;
  let touchStartHandler: ((e: TouchEvent) => void) | null = null;
  let touchTarget: HTMLElement | null = null;
  let touchEndHandler: ((e: TouchEvent) => void) | null = null;
  
  // Touch tracking for swipe detection
  let touchStartX: number | null = null;
  let touchStartY: number | null = null;
  let touchStartTime: number | null = null;

  onMount(() => {
    pageStartTime = Date.now();

    // Track page start (InViewport equivalent)
    trackEvent(AnalyticsEventAction.PAGE_START, {
      [ANALYTICS_EVENT_KEYS.action]: AnalyticsEventAction.PAGE_START,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.NAVIGATION,
      [ANALYTICS_EVENT_KEYS.pageName]: pageName,
      ...(section && { [ANALYTICS_EVENT_KEYS.section]: section }),
      ...metadata,
      timestamp: pageStartTime,
      url: window.location.href,
      referrer: document.referrer,
    });

    // Track page visibility changes (user switches tabs)
    visibilityChangeHandler = () => {
      if (document.hidden) {
        // User left the page/tab
        trackEvent(AnalyticsEventAction.VIEWED, {
          [ANALYTICS_EVENT_KEYS.action]: 'PAGE_HIDDEN',
          [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.NAVIGATION,
          [ANALYTICS_EVENT_KEYS.pageName]: pageName,
          ...(section && { [ANALYTICS_EVENT_KEYS.section]: section }),
          ...metadata,
          timestamp: Date.now(),
        });
      } else {
        // User returned to the page/tab
        trackEvent(AnalyticsEventAction.VIEWED, {
          [ANALYTICS_EVENT_KEYS.action]: 'PAGE_VISIBLE',
          [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.NAVIGATION,
          [ANALYTICS_EVENT_KEYS.pageName]: pageName,
          ...(section && { [ANALYTICS_EVENT_KEYS.section]: section }),
          ...metadata,
          timestamp: Date.now(),
        });
      }
    };

    document.addEventListener('visibilitychange', visibilityChangeHandler);

    // Touch event handlers for horizontal swipe detection
    touchStartHandler = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      touchTarget = e.target as HTMLElement;
    };

    touchEndHandler = (e: TouchEvent) => {
      if (touchStartX === null || touchStartY === null || touchStartTime === null) return;

      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const touchEndY = touch.clientY;
      const touchEndTime = Date.now();

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      const duration = touchEndTime - touchStartTime;


      // Check if it's a horizontal swipe
      // Horizontal movement must be greater than vertical movement
      // Minimum swipe distance: 50px
      // Maximum duration: 500ms
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && 
                                Math.abs(deltaX) > 50 && 
                                duration < 500;

      if (isHorizontalSwipe) {
        const direction = deltaX > 0 ? 'right' : 'left';
        const distance = Math.abs(deltaX);

        // Find which section was swiped
        let swipedSection = section; // Default to page-level section
        if (touchTarget) {
          // Look for closest parent with data-section-name or data-section-type attribute
          const sectionElement = touchTarget.closest('[data-section-name], [data-section-type]');
          if (sectionElement) {
            swipedSection = 
              sectionElement.getAttribute('data-section-name') || 
              sectionElement.getAttribute('data-section-type') || 
              section;
          }
        }

        trackEvent(AnalyticsEventAction.SWIPE, {
          [ANALYTICS_EVENT_KEYS.action]: 'HORIZONTAL_SWIPE',
          [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.NAVIGATION,
          [ANALYTICS_EVENT_KEYS.pageName]: pageName,
          ...(swipedSection && { [ANALYTICS_EVENT_KEYS.section]: swipedSection }),
          ...metadata,
          swipeDirection: direction,
          swipeDistance: Math.round(distance),
          swipeDuration: duration,
          timestamp: Date.now(),
        });
      }

      // Reset touch tracking
      touchStartX = null;
      touchStartY = null;
      touchStartTime = null;
      touchTarget = null;
    };

    document.addEventListener('touchstart', touchStartHandler, { passive: true });
    document.addEventListener('touchend', touchEndHandler, { passive: true });
  });

  onDestroy(() => {
    if (!pageStartTime) return;

    const timeOnPage = Date.now() - pageStartTime;

    // Track page end (OutOfViewport equivalent)
    trackEvent(AnalyticsEventAction.PAGE_END, {
      [ANALYTICS_EVENT_KEYS.action]: AnalyticsEventAction.PAGE_END,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.NAVIGATION,
      [ANALYTICS_EVENT_KEYS.pageName]: pageName,
      ...(section && { [ANALYTICS_EVENT_KEYS.section]: section }),
      ...metadata,
      timestamp: Date.now(),
      timeOnPage, // in milliseconds
      timeOnPageSeconds: Math.round(timeOnPage / 1000),
    });

    // Cleanup visibility listener
    if (visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
    }

    // Cleanup touch listeners
    if (touchStartHandler) {
      document.removeEventListener('touchstart', touchStartHandler);
    }
    if (touchEndHandler) {
      document.removeEventListener('touchend', touchEndHandler);
    }
  });
}
