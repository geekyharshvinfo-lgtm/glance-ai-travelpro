/**
 * TryOn store for managing try-on state and results
 */
import { SvelteSet } from 'svelte/reactivity';
import { browser } from '$app/environment';
import { createReactiveStorageSync } from '$lib/services/storageSync';
import { TRYON_PENDING_GENERATIONS, TRYON_TIMER_DATA } from '$lib/constants/storage';

export interface TryOnStore {
  loadingTryOn: Record<string, boolean>;
  tryOnResults: Record<string, string | undefined>;
  processingStartTime: Date | null;
  elapsedTimes: Record<string, string>;
  imageLoadingStates: Record<string, boolean>;
}

// Persistent data structures
export interface PendingGeneration {
  itemId: string;
  influencerId: string;
  jobId?: string; // Store the job ID for polling
  startTime: number;
  expiryTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  imageUrl?: string;
  item?: {
    image: string;
    name: string;
    title?: string;
    type?: string;
    brandPersona?: string;
  };
  // Chat-specific fields
  type?: 'tryon' | 'chat-vton'; // Type to distinguish between regular try-on and chat VTON
  chatData?: {
    messageId: string;
    sessionId: string;
    timerText: string;
  };
}

interface TimerData {
  itemId: string;
  startTime: number;
}

// Initialize storage sync for pending generations
const pendingGenerationsSync = createReactiveStorageSync<Record<string, PendingGeneration>>(
  TRYON_PENDING_GENERATIONS,
  {},
  {
    storageType: 'localStorage', // Use localStorage to persist across tabs
    onError: (error) => console.error('[TryOnStore] Storage sync error:', error),
  }
);

// Initialize storage sync for timer data
const timerDataSync = createReactiveStorageSync<TimerData[]>(TRYON_TIMER_DATA, [], {
  storageType: 'localStorage', // Use localStorage to persist across tabs
  onError: (error) => console.error('[TryOnStore] Timer sync error:', error),
});

// Create the reactive store
export const tryOnStore = $state<TryOnStore>({
  loadingTryOn: {},
  tryOnResults: {},
  processingStartTime: null,
  elapsedTimes: {},
  imageLoadingStates: {},
});

// Persistent store for pending generations
export const pendingGenerations = $state<Record<string, PendingGeneration>>(
  pendingGenerationsSync.initialValue
);

// Removed verbose initialization logs

// Sync pending generations to storage on change (debounced to avoid
// rapid localStorage writes during polling / status transitions)
$effect.root(() => {
  let debounceTimer: ReturnType<typeof setTimeout>;
  $effect(() => {
    const snapshot = $state.snapshot(pendingGenerations);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (Object.keys(snapshot).length > 0) {
        pendingGenerationsSync.sync.write(snapshot);
      } else {
        pendingGenerationsSync.sync.remove();
      }
    }, 300);
  });
});

// Helper function to clean up expired and failed generations on startup
function cleanupExpiredGenerations() {
  const now = Date.now();
  const toRemove: string[] = [];

  for (const [itemId, generation] of Object.entries(pendingGenerations)) {
    // Remove expired generations
    if (generation.expiryTime < now) {
      toRemove.push(itemId);
    }
    // Remove failed generations
    else if (generation.status === 'failed') {
      toRemove.push(itemId);
    }
  }

  if (toRemove.length > 0) {
    toRemove.forEach((id) => delete pendingGenerations[id]);
  }
}

// Clean up on initialization
if (browser) {
  // If pendingGenerations is empty but localStorage has data, manually load it
  if (Object.keys(pendingGenerations).length === 0) {
    const storedData = localStorage.getItem(TRYON_PENDING_GENERATIONS);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        Object.assign(pendingGenerations, parsed);
      } catch (e) {
        console.error('[TryOnStore] Failed to parse localStorage data:', e);
      }
    }
  }

  cleanupExpiredGenerations();

  // Listen for storage changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === TRYON_PENDING_GENERATIONS && e.newValue) {
      try {
        const newData = JSON.parse(e.newValue);
        console.log('[TryOnStore] Pending generations updated from another tab');

        // Replace our local state with data from other tab.
        // First remove keys that were deleted remotely, then merge new data.
        for (const key of Object.keys(pendingGenerations)) {
          if (!(key in newData)) {
            delete pendingGenerations[key];
          }
        }
        Object.assign(pendingGenerations, newData);

        // Check if any generations completed in another tab
        for (const [itemId, generation] of Object.entries(newData) as [
          string,
          PendingGeneration,
        ][]) {
          if (generation.status === 'completed' && generation.imageUrl) {
            // Update local try-on results
            if (!tryOnStore.tryOnResults[itemId]) {
              setTryOnResult(itemId, generation.imageUrl);
            }
          }
        }
      } catch (error) {
        console.error('[TryOnStore] Failed to sync from other tab:', error);
      }
    }
  });
}

// Helper functions
export function setTryOnLoading(itemId: string) {
  tryOnStore.loadingTryOn = { ...tryOnStore.loadingTryOn, [itemId]: true };
}

// Add pending generation tracking
export function addPendingGeneration(generation: PendingGeneration) {
  pendingGenerations[generation.itemId] = generation;
}

export function updatePendingGenerationStatus(
  itemId: string,
  status: PendingGeneration['status'],
  imageUrl?: string,
  jobId?: string
) {
  console.log(
    `[TryOnStore] Updating pending generation ${itemId} with status: ${status}, jobId: ${jobId}`
  );
  if (pendingGenerations[itemId]) {
    pendingGenerations[itemId] = {
      ...pendingGenerations[itemId],
      status,
      ...(imageUrl && { imageUrl }),
      ...(jobId && { jobId }),
    };
    console.log(`[TryOnStore] Updated generation:`, $state.snapshot(pendingGenerations[itemId]));
  } else {
    console.log(`[TryOnStore] Warning: No pending generation found for ${itemId}`);
  }
}

export function removePendingGeneration(itemId: string) {
  delete pendingGenerations[itemId];
}

export function setTryOnResult(itemId: string, imageUrl: string) {
  tryOnStore.tryOnResults = { ...tryOnStore.tryOnResults, [itemId]: imageUrl };
}

export function setTryOnElapsedTime(itemId: string, elapsed: string) {
  tryOnStore.elapsedTimes = { ...tryOnStore.elapsedTimes, [itemId]: elapsed };
}

export function setTryOnImageLoading(itemId: string, isLoading: boolean) {
  tryOnStore.imageLoadingStates = { ...tryOnStore.imageLoadingStates, [itemId]: isLoading };
}

export function resetTryOnItem(itemId: string, clearResult = true) {
  const { [itemId]: _, ...remainingLoading } = tryOnStore.loadingTryOn;
  tryOnStore.loadingTryOn = remainingLoading;

  if (clearResult) {
    const { [itemId]: __, ...remainingResults } = tryOnStore.tryOnResults;
    tryOnStore.tryOnResults = remainingResults;
  }

  const { [itemId]: ___, ...remainingElapsed } = tryOnStore.elapsedTimes;
  tryOnStore.elapsedTimes = remainingElapsed;

  const { [itemId]: ____, ...remainingImageLoading } = tryOnStore.imageLoadingStates;
  tryOnStore.imageLoadingStates = remainingImageLoading;
}

// Track active timer intervals so they can be cleared on full reset
const activeTimers = new SvelteSet<ReturnType<typeof setInterval>>();

export function registerTimer(timer: ReturnType<typeof setInterval>) {
  activeTimers.add(timer);
}

export function unregisterTimer(timer: ReturnType<typeof setInterval>) {
  activeTimers.delete(timer);
}

export function resetAllTryOn() {
  // Clear all active timers to prevent leaked intervals writing to reset state
  for (const timer of activeTimers) {
    clearInterval(timer);
  }
  activeTimers.clear();

  tryOnStore.loadingTryOn = {};
  tryOnStore.tryOnResults = {};
  tryOnStore.processingStartTime = null;
  tryOnStore.elapsedTimes = {};
  tryOnStore.imageLoadingStates = {};

  // Clear persistent data (debounced $effect handles localStorage removal)
  for (const key of Object.keys(pendingGenerations)) {
    delete pendingGenerations[key];
  }
  timerDataSync.sync.remove();
}

// Chat VTON specific helpers
export function addChatVtonTimer(
  messageId: string,
  influencerId: string,
  sessionId: string,
  timerMs: number,
  timerText: string,
  productName?: string
) {
  const generation: PendingGeneration = {
    itemId: `chat-vton-${messageId}`,
    influencerId,
    startTime: Date.now(),
    expiryTime: Date.now() + timerMs,
    status: 'processing',
    type: 'chat-vton',
    chatData: {
      messageId,
      sessionId,
      timerText,
    },
  };

  // Add item information if product name is available
  if (productName) {
    generation.item = {
      image: '', // Not needed for chat VTON
      name: productName,
      type: 'chat-product',
      brandPersona: '',
    };
  }

  addPendingGeneration(generation);
}

export function getChatVtonRemainingTime(messageId: string): number {
  const itemId = `chat-vton-${messageId}`;
  const generation = pendingGenerations[itemId];
  if (!generation || generation.type !== 'chat-vton') return 0;

  const now = Date.now();
  const remaining = generation.expiryTime - now;
  return Math.max(0, remaining);
}

export function removeChatVtonTimer(messageId: string) {
  const itemId = `chat-vton-${messageId}`;
  removePendingGeneration(itemId);
}

export function getChatVtonTimersForSession(sessionId: string): PendingGeneration[] {
  return Object.values(pendingGenerations).filter(
    (gen) => gen.type === 'chat-vton' && gen.chatData?.sessionId === sessionId
  );
}
