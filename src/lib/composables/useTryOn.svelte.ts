/**
 * Try-On Composable
 * Centralizes all try-on state management and business logic
 * Used across LatestSection, TimelessSection, FunkSection, and WardrobeSection
 */

import {
  formatTime,
  checkUserAuth,
  preloadImage,
  createTryOnJobOnly,
  pollExistingTryOnJob,
} from '$lib/utils/tryOnUtil';
import type { TryOnItem } from '$lib/utils/tryOnUtil';
import * as Sentry from '@sentry/sveltekit';
import {
  tryOnStore,
  setTryOnLoading,
  setTryOnResult,
  setTryOnElapsedTime,
  setTryOnImageLoading,
  resetTryOnItem,
  resetAllTryOn,
  registerTimer,
  unregisterTimer,
  pendingGenerations,
  addPendingGeneration,
  updatePendingGenerationStatus,
  removePendingGeneration,
  type PendingGeneration,
} from '$lib/stores/tryOnStore.svelte';
import { userStore } from '$lib/stores/user.svelte';
import { onboardingStore, startOnboarding, setOnboardingStep } from '$lib/stores/onboarding.svelte';
import { loginStore } from '$lib/stores/login.svelte';
import { TOTAL_TIME_FOR_TRYON, LOGIN_REQUIRED } from '$lib/config/env';
import { isGenderMismatch } from '$lib/utils/tryOnUtil';
import { showToast } from '$lib/stores/toast.svelte';
import { browser } from '$app/environment';
import { setPendingLoginAction, consumeRestoredAction } from '$lib/services/loginIntent';
import type { LoginIntentAction } from '$lib/services/loginIntent';
import { chatStore } from '$lib/stores/chatStore.svelte';
import { collectionDrawerStore, openCollectionDrawer } from '$lib/stores/collectionDrawer.svelte';
import { getCollectionNavData } from '$lib/utils/collectionNavigation';
import { trackEvent } from '$lib/utils/analytics';
import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES } from '$lib/constants/analytics';

// --- Module-level pending try-on state ---
// Tracks a try-on that was deferred because the user needed to log in or onboard.
// Only one try-on can be pending at a time (user can only click one Style Me button).
interface PendingTryOn {
  item: TryOnItem & { title?: string };
  influencerId: string;
}

let pendingTryOn = $state<PendingTryOn | null>(null);
let onboardingAttempted = $state(false);

/**
 * Execute the full try-on flow: loading state → timer → API call → result.
 * Works at module level — does not depend on any component instance.
 */
async function executeTryOn(
  item: TryOnItem & { title?: string },
  influencerId: string,
  analyticsOptions?: {
    pageName?: string;
    section?: string;
  }
): Promise<void> {
  const itemId = item.id;

  setTryOnLoading(itemId);
  const itemStartTime = Date.now();
  const expiryTime = itemStartTime + TOTAL_TIME_FOR_TRYON * 1000;
  setTryOnElapsedTime(itemId, formatTime(TOTAL_TIME_FOR_TRYON));

  // Add to pending generations for persistence (jobId will be added later)
  const pendingGen: PendingGeneration = {
    itemId,
    influencerId,
    startTime: itemStartTime,
    expiryTime,
    status: 'pending', // Start as pending until we have jobId
    item: {
      image: item.image,
      name: item.name || item.title || '',
      title: item.title,
      type: item.type,
      brandPersona: item.brandPersona,
    },
  };
  addPendingGeneration(pendingGen);

  const timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - itemStartTime) / 1000);
    const remaining = TOTAL_TIME_FOR_TRYON - elapsed;

    if (remaining <= 0) {
      setTryOnElapsedTime(itemId, '00:00');
      clearInterval(timerInterval);
      unregisterTimer(timerInterval);
      return;
    }
    setTryOnElapsedTime(itemId, formatTime(remaining));
  }, 1000);
  registerTimer(timerInterval);

  function stopTimer() {
    clearInterval(timerInterval);
    unregisterTimer(timerInterval);
  }

  try {
    const tryOnItem: TryOnItem = {
      id: item.id,
      image: item.image,
      name: item.name || item.title || '',
      type: item.type,
      brandPersona: item.brandPersona,
    };

    // Check auth first
    const authResult = await checkUserAuth(tryOnItem, influencerId);

    if (authResult.needsLogin || authResult.needsOnboarding) {
      stopTimer();
      resetTryOnItem(itemId);
      updatePendingGenerationStatus(itemId, 'failed');
      removePendingGeneration(itemId);
      pendingTryOn = { item, influencerId };
      onboardingAttempted = authResult.needsOnboarding ? true : false;

      // Pre-set the login intent action so that if the login flow uses
      // OAuth redirect (in-app WebView), the try-on item survives the
      // page reload and can be resumed after authentication.
      if (authResult.needsLogin) {
        setPendingLoginAction({
          type: 'tryon',
          itemId: item.id,
          influencerId,
          collectionOpen: collectionDrawerStore.isOpen,
          collectionMode: collectionDrawerStore.mode,
          collectionSectionId: collectionDrawerStore.sectionId || undefined,
          collectionInfluencerSlug: collectionDrawerStore.influencerSlug || undefined,
          item: {
            id: item.id,
            image: item.image,
            name: item.name || item.title || '',
            title: item.title,
            type: item.type,
            brandPersona: item.brandPersona,
          },
        });
      }
      return;
    }

    // Create job and store jobId
    const jobResult = await createTryOnJobOnly(tryOnItem, influencerId, analyticsOptions);

    if (!jobResult.success || !jobResult.jobId) {
      stopTimer();
      resetTryOnItem(itemId);
      updatePendingGenerationStatus(itemId, 'failed');
      removePendingGeneration(itemId);
      showToast('Couldn\u2019t start your try-on. Please try again.', 'error');
      return;
    }

    // Update pending generation with jobId and status
    console.log(`[TryOn] Created job ${jobResult.jobId} for item ${itemId}`);
    updatePendingGenerationStatus(itemId, 'processing', undefined, jobResult.jobId);

    // Create abort controller for polling
    const abortController = new AbortController();

    // Poll for status
    const pollResult = await pollExistingTryOnJob(jobResult.jobId, abortController.signal, {
      ...analyticsOptions,
      productId: tryOnItem.id,
      productName: tryOnItem.name,
    });

    if (!pollResult.success || !pollResult.imageUrl) {
      stopTimer();
      resetTryOnItem(itemId);
      updatePendingGenerationStatus(itemId, 'failed');
      removePendingGeneration(itemId);
      showToast('Try-on generation failed. Please try again.', 'error');
      return;
    }

    // Preload result image
    try {
      setTryOnImageLoading(itemId, true);
      await preloadImage(pollResult.imageUrl);
      setTryOnResult(itemId, pollResult.imageUrl);
      updatePendingGenerationStatus(itemId, 'completed', pollResult.imageUrl);

      // Remove from pending after a short delay to allow for UI updates
      setTimeout(() => removePendingGeneration(itemId), 2000);
    } catch {
      setTryOnImageLoading(itemId, false);
      resetTryOnItem(itemId);
      updatePendingGenerationStatus(itemId, 'failed');
      removePendingGeneration(itemId);
      showToast('Couldn\u2019t load the try-on result. Please try again.', 'error');
    } finally {
      if (Object.keys(tryOnStore.loadingTryOn).length === 0) {
        stopTimer();
        tryOnStore.processingStartTime = null;
      }
    }
  } catch {
    stopTimer();
    resetTryOnItem(itemId);
    updatePendingGenerationStatus(itemId, 'failed');
    removePendingGeneration(itemId);
    showToast('Something went wrong with try-on. Please try again.', 'error');
  }
}

/**
 * Poll for a `[data-item-id]` element in the DOM. Returns a cancel function
 * so callers (or effect cleanup) can stop the polling chain early.
 */
function pollForElement(
  itemId: string,
  maxAttempts: number,
  onFound: (el: HTMLElement | null) => void
): () => void {
  let attempts = 0;
  let cancelled = false;
  let timerId: ReturnType<typeof setTimeout>;

  const check = () => {
    if (cancelled) return;
    const el = document.querySelector<HTMLElement>(`[data-item-id="${itemId}"]`);
    if (el || ++attempts >= maxAttempts) {
      onFound(el);
      return;
    }
    timerId = setTimeout(check, 150);
  };

  check();
  return () => {
    cancelled = true;
    clearTimeout(timerId);
  };
}

function scrollToProduct(itemId: string): () => void {
  return pollForElement(itemId, 20, (el) => {
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const scrollContainer = el.closest<HTMLElement>(
        '.products-scroll, .collection-grid, .scroll-x'
      );
      if (!scrollContainer) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset =
        elRect.left -
        containerRect.left +
        scrollContainer.scrollLeft -
        (containerRect.width - elRect.width) / 2;
      scrollContainer.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }, 300);
  });
}

/**
 * Restore a deferred try-on action from the in-memory relay set by
 * completeLogin. Returns a cancel function for effect cleanup.
 */
function restoreTryOnIntent(action: Extract<LoginIntentAction, { type: 'tryon' }>): () => void {
  const { itemId, influencerId, item, collectionOpen } = action;
  const { collectionMode, collectionSectionId, collectionInfluencerSlug } = action;
  const restoredItem = {
    id: itemId,
    image: item.image,
    name: item.name || '',
    title: item.title,
    type: item.type,
    brandPersona: item.brandPersona,
  };

  let cancelScroll: (() => void) | undefined;
  if (collectionOpen) {
    if (collectionMode === 'productGrid' && collectionSectionId && collectionInfluencerSlug) {
      openCollectionDrawer({
        mode: 'productGrid',
        sectionId: collectionSectionId,
        influencerSlug: collectionInfluencerSlug,
        collectionLoading: true,
      });
    } else {
      const navData = getCollectionNavData();
      openCollectionDrawer({
        selectedProductId: navData?.productId || itemId,
        selectedHeroImage: navData?.heroImage || '',
        selectedHeroProducts: navData?.heroProducts || [],
        generatedHeroImage: navData?.generatedLook || null,
      });
    }
  } else {
    cancelScroll = scrollToProduct(itemId);
  }

  const cancelPoll = pollForElement(itemId, 30, (el) => {
    if (!el) {
      showToast('Couldn\u2019t find the product. Try selecting it again.', 'error');
      return;
    }
    pendingTryOn = { item: restoredItem, influencerId };
  });

  return () => {
    cancelScroll?.();
    cancelPoll();
  };
}

function restoreStyleMeIntent(action: Extract<LoginIntentAction, { type: 'styleme' }>): void {
  try {
    const { product } = action;
    chatStore.setPendingStyleMe({
      id: product.id,
      ppid: product.ppid,
      imageUrl: product.imageUrl,
      brand: product.brand,
      price: product.price,
      cta: product.cta,
      message: product.message,
      gender: product.gender,
    });
  } catch {
    showToast('Couldn\u2019t restore your style request. Please try again.', 'error');
  }
}

// Module-level $effect.root watches auth/onboarding state and auto-retries the pending try-on.
$effect.root(() => {
  // Effect 1 — Restore a deferred action from the in-memory relay after
  // an OAuth redirect login. Only relevant when LOGIN_REQUIRED is true;
  // without login there are no OAuth redirects to restore from.
  let intentChecked = false;

  $effect(() => {
    if (!LOGIN_REQUIRED) return;
    if (intentChecked || pendingTryOn) return;
    if (loginStore.loginInProgress) return;
    if (!userStore.isLoggedIn) return;
    if (onboardingStore.isActive) return;

    const action = consumeRestoredAction();
    if (!action) return;

    intentChecked = true;
    if (action.type === 'tryon') {
      return restoreTryOnIntent(action);
    } else if (action.type === 'styleme') {
      restoreStyleMeIntent(action);
    }
  });

  // Effect 2 — Act on the pending try-on (from in-memory click or restored intent).
  let wasOnboardingActive = false;

  $effect(() => {
    if (!pendingTryOn) return;

    if (
      loginStore.isPopupVisible ||
      loginStore.isAgeConsentPopupVisible ||
      loginStore.loginInProgress
    )
      return;

    const onboardingJustClosed = wasOnboardingActive && !onboardingStore.isActive;
    wasOnboardingActive = onboardingStore.isActive;

    // "authorized" means: login not required, OR logged in, OR guest who uploaded a selfie (skipped login)
    const authorized = !LOGIN_REQUIRED || userStore.isLoggedIn || !!userStore.profileImage;

    if (onboardingJustClosed && !userStore.profileImage) {
      // Onboarding dismissed without a selfie — cancel the pending try-on
      pendingTryOn = null;
      onboardingAttempted = false;
      return;
    }

    if (onboardingStore.isActive) return;

    if (authorized && userStore.profileImage) {
      const pending = pendingTryOn;
      pendingTryOn = null;
      onboardingAttempted = false;
      executeTryOn(pending.item, pending.influencerId);
    } else if (authorized && !userStore.profileImage && !onboardingAttempted) {
      onboardingAttempted = true;
      setOnboardingStep('selfie');
      startOnboarding();
    }
  });
});

/**
 * Resume pending generations from previous session
 */
function resumePendingGenerations() {
  // console.log('[TryOn] Resuming pending generations:', pendingGenerations);
  const now = Date.now();

  for (const [itemId, generation] of Object.entries(pendingGenerations)) {
    // console.log(`[TryOn] Processing generation ${itemId}:`, generation);

    // Skip expired generations
    if (generation.expiryTime < now) {
      // console.log(`[TryOn] Removing expired generation ${itemId}`);
      removePendingGeneration(itemId);
      continue;
    }

    // Calculate remaining time
    const elapsed = Math.floor((now - generation.startTime) / 1000);
    const remaining = TOTAL_TIME_FOR_TRYON - elapsed;

    if (remaining <= 0) {
      // console.log(`[TryOn] Removing timed out generation ${itemId}`);
      removePendingGeneration(itemId);
      continue;
    }

    // Skip failed generations
    if (generation.status === 'failed') {
      // console.log(`[TryOn] Skipping failed generation ${itemId}`);
      removePendingGeneration(itemId);
      continue;
    }

    // Handle pending generations (created but no jobId yet)
    if (generation.status === 'pending' || !generation.jobId) {
      console.log(`[TryOn] Found pending generation without jobId for ${itemId}, retrying...`);
      // Retry the try-on from the beginning
      if (generation.item) {
        const item: TryOnItem & { title?: string } = {
          id: itemId,
          image: generation.item.image,
          name: generation.item.name,
          title: generation.item.title,
          type: generation.item.type,
          brandPersona: generation.item.brandPersona,
        };
        executeTryOn(item, generation.influencerId);
      } else {
        removePendingGeneration(itemId);
      }
      continue;
    }

    // Resume the generation based on status
    if (generation.status === 'processing' && generation.jobId) {
      console.log(`[TryOn] Resuming processing generation ${itemId}, jobId: ${generation.jobId}`);

      // Resume loading state
      setTryOnLoading(itemId);
      setTryOnElapsedTime(itemId, formatTime(remaining));

      // Resume timer
      const timerInterval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - generation.startTime) / 1000);
        const currentRemaining = TOTAL_TIME_FOR_TRYON - currentElapsed;

        if (currentRemaining <= 0) {
          setTryOnElapsedTime(itemId, '00:00');
          clearInterval(timerInterval);
          unregisterTimer(timerInterval);
          resetTryOnItem(itemId);
          removePendingGeneration(itemId);
          return;
        }
        setTryOnElapsedTime(itemId, formatTime(currentRemaining));
      }, 1000);
      registerTimer(timerInterval);

      // Resume polling if jobId exists
      if (generation.jobId) {
        console.log(`[TryOn] Resuming polling for job ${generation.jobId}, itemId: ${itemId}`);

        // Block polling only if login is required AND user has no selfie (pure guest with no session)
        if (LOGIN_REQUIRED && !userStore.isLoggedIn && !userStore.profileImage) {
          console.log('[TryOn] Cannot resume polling - user not logged in and no selfie');
          continue;
        }

        // Create abort controller for polling
        const abortController = new AbortController();

        // Construct analytics options from generation data
        const analyticsOptions = {
          pageName: generation.type === 'chat-vton' ? PAGE_NAMES.CHAT_PAGE : PAGE_NAMES.HOME_PAGE,
          section: generation.type === 'chat-vton' ? 'chat' : 'resumed_tryon',
          productId: itemId,
          productName: generation.item?.name || 'Unknown',
        };

        // Poll for status asynchronously
        pollExistingTryOnJob(generation.jobId, abortController.signal, analyticsOptions)
          .then((pollResult) => {
            if (pollResult.success && pollResult.imageUrl) {
              // Clear timer first
              clearInterval(timerInterval);
              unregisterTimer(timerInterval);

              // Set result
              setTryOnImageLoading(itemId, true);
              preloadImage(pollResult.imageUrl!)
                .then(() => {
                  setTryOnResult(itemId, pollResult.imageUrl!);
                  updatePendingGenerationStatus(itemId, 'completed', pollResult.imageUrl);
                  setTryOnImageLoading(itemId, false);
                  resetTryOnItem(itemId, false);

                  // Remove from pending after delay
                  setTimeout(() => removePendingGeneration(itemId), 2000);
                })
                .catch((error) => {
                  Sentry.captureException(error, { tags: { operation: 'tryon_image_preload' } });
                  setTryOnImageLoading(itemId, false);
                  resetTryOnItem(itemId);
                  updatePendingGenerationStatus(itemId, 'failed');
                  removePendingGeneration(itemId);
                });
            } else {
              // Clear timer on failure
              clearInterval(timerInterval);
              unregisterTimer(timerInterval);
              resetTryOnItem(itemId);
              updatePendingGenerationStatus(itemId, 'failed');
              removePendingGeneration(itemId);
            }
          })
          .catch((error) => {
            console.error('Failed to resume polling:', error);
            Sentry.captureException(error, { tags: { operation: 'tryon_resume_polling' } });
            clearInterval(timerInterval);
            unregisterTimer(timerInterval);
            resetTryOnItem(itemId);
            removePendingGeneration(itemId);
          });
      }
    } else if (generation.status === 'completed' && generation.imageUrl) {
      // Restore completed result
      setTryOnResult(itemId, generation.imageUrl);
    }
  }
}

// Resume on module load with delay to ensure auth is ready
if (browser) {
  // Add delay like embed project to ensure auth tokens are restored
  setTimeout(() => {
    const authorized = !LOGIN_REQUIRED || userStore.isLoggedIn || !!userStore.profileImage;
    if (authorized) {
      resumePendingGenerations();
    } else {
      // Clear stale data only for pure guests with no selfie (no session to resume)
      resetAllTryOn();
    }
  }, 2000); // 2 second delay to ensure auth is fully ready
}

// Export function to clear pending try on (for logout)
export function clearPendingTryOn() {
  console.log('[TryOn] Clearing pending try-on state');
  pendingTryOn = null;
  onboardingAttempted = false;
}

export function useTryOn(influencerId?: string) {
  function isButtonDisabled(itemId: string): boolean {
    return (
      tryOnStore.loadingTryOn[itemId] ||
      tryOnStore.imageLoadingStates[itemId] ||
      !!tryOnStore.tryOnResults[itemId] ||
      // isGenderMismatch() ||
      pendingTryOn?.item.id === itemId ||
      (!!pendingGenerations[itemId] && pendingGenerations[itemId].status !== 'failed') // Only disable if exists and NOT failed
    );
  }

  function handleTryOnImageLoadComplete(itemId: string) {
    setTryOnImageLoading(itemId, false);
    resetTryOnItem(itemId, false);
  }

  async function handleStyleMeClick(
    item: TryOnItem & { title?: string },
    options?: {
      pageName?: string;
      section?: string;
      label?: string;
      cardIndex?: number;
    }
  ) {
    if (!influencerId) {
      console.error('Missing influencer ID for try-on');
      return;
    }

    // Track analytics if options are provided
    if (options?.pageName && options?.section) {
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.TRY_ON_CLICK,
        [ANALYTICS_EVENT_KEYS.pageName]: options.pageName,
        [ANALYTICS_EVENT_KEYS.section]: options.section,
        [ANALYTICS_EVENT_KEYS.productId]: item.id,
        [ANALYTICS_EVENT_KEYS.label]: options.label || 'try_on_button',
        [ANALYTICS_EVENT_KEYS.cardIndex]: options.cardIndex,
      });
    }

    if (isGenderMismatch()) {
      let influencerGender = null;
      let errorMessage = 'Sorry, this influencer is only available for a specific gender.';
      if (browser) {
        influencerGender = localStorage.getItem('influencer_gender');
        if (influencerGender) {
          errorMessage = `Sorry, this influencer is only available for '${influencerGender}' users.`;
        }
      }
      showToast(errorMessage, 'error');
      return;
    }

    await executeTryOn(item, influencerId, options);
  }

  function resetProcessingState(timerInterval?: NodeJS.Timeout, itemId?: string) {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    if (itemId) {
      resetTryOnItem(itemId);
    } else {
      resetAllTryOn();
    }
    tryOnStore.processingStartTime = null;
  }

  return {
    tryOnStore,
    isButtonDisabled,
    handleStyleMeClick,
    handleTryOnImageLoadComplete,
    resetProcessingState,
  };
}
