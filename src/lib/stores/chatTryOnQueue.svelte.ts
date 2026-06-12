/**
 * Chat Try-On Queue Store
 * Manages a queue of products waiting for try-on generation in chat.
 * Only one product can be in the queue at a time.
 * Syncs with localStorage for persistence across page refreshes.
 */

import { browser } from '$app/environment';

const STORAGE_KEY = 'ai_influencer_chat_tryon_queue';

export interface QueueItem {
  productId: string;
  productName: string;
  addedAt: number;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
}

// Reactive state
let queueItem = $state<QueueItem | null>(null);

// Initialize from localStorage on module load
if (browser) {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const item: QueueItem = JSON.parse(stored);

      // Check for stale items (older than 5 minutes and still waiting/processing)
      const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
      if (
        Date.now() - item.addedAt > MAX_AGE_MS &&
        (item.status === 'waiting' || item.status === 'processing')
      ) {
        console.log('[ChatTryOnQueue] Removing stale queue item on init:', item);
        localStorage.removeItem(STORAGE_KEY);
      } else if (item.status === 'completed' || item.status === 'failed') {
        // If completed or failed, clear it
        localStorage.removeItem(STORAGE_KEY);
      } else {
        queueItem = item;
        console.log('[ChatTryOnQueue] Initialized from localStorage:', item);
      }
    } catch {
      // Ignore parse errors
    }
  }
}

// Derived reactive values for external use
export const queueState = {
  get item() {
    return queueItem;
  },
  get hasActive() {
    return (
      queueItem !== null && (queueItem.status === 'waiting' || queueItem.status === 'processing')
    );
  },
  get activeItem() {
    if (
      queueItem !== null &&
      (queueItem.status === 'waiting' || queueItem.status === 'processing')
    ) {
      return queueItem;
    }
    return null;
  },
};

/**
 * Load queue from localStorage
 */
function _loadFromStorage(): QueueItem | null {
  if (!browser) return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const item: QueueItem = JSON.parse(stored);

    // Check for stale items (older than 5 minutes and still waiting/processing)
    const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
    if (
      Date.now() - item.addedAt > MAX_AGE_MS &&
      (item.status === 'waiting' || item.status === 'processing')
    ) {
      console.log('[ChatTryOnQueue] Removing stale queue item:', item);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // If completed or failed, clear it
    if (item.status === 'completed' || item.status === 'failed') {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return item;
  } catch {
    return null;
  }
}

/**
 * Save queue to localStorage
 */
function saveToStorage(item: QueueItem | null): void {
  if (!browser) return;

  try {
    if (item) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(item));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Add a product to the queue
 */
export function addToChatTryOnQueue(productId: string, productName: string): void {
  const item: QueueItem = {
    productId,
    productName,
    addedAt: Date.now(),
    status: 'waiting',
  };

  queueItem = item;
  saveToStorage(item);
  console.log('[ChatTryOnQueue] Added to queue:', item);
}

/**
 * Update the status of the queue item
 */
export function updateQueueStatus(status: QueueItem['status']): void {
  if (!queueItem) return;

  queueItem = { ...queueItem, status };
  saveToStorage(queueItem);
  console.log('[ChatTryOnQueue] Updated status:', status);
}

/**
 * Mark queue item as processing (timer has started) and clear queue
 * This enables other Style Me buttons once the timer starts
 */
export function markQueueProcessing(): void {
  console.log('[ChatTryOnQueue] Timer started, clearing queue to enable other buttons');
  queueItem = null;
  saveToStorage(null);
}

/**
 * Mark queue item as completed and clear from queue
 */
export function markQueueCompleted(): void {
  console.log('[ChatTryOnQueue] Marking as completed and clearing');
  queueItem = null;
  saveToStorage(null);
}

/**
 * Mark queue item as failed and clear from queue
 */
export function markQueueFailed(): void {
  console.log('[ChatTryOnQueue] Marking as failed and clearing');
  queueItem = null;
  saveToStorage(null);
}

/**
 * Clear the queue
 */
export function clearChatTryOnQueue(): void {
  queueItem = null;
  saveToStorage(null);
}

/**
 * Check if a specific product is in the queue
 */
export function isProductInQueue(productId: string): boolean {
  return queueItem?.productId === productId;
}

/**
 * Check if there's any active item in the queue (waiting or processing)
 */
export function hasActiveQueueItem(): boolean {
  return (
    queueItem !== null && (queueItem.status === 'waiting' || queueItem.status === 'processing')
  );
}

/**
 * Get the active queue item
 */
export function getActiveQueueItem(): QueueItem | null {
  if (hasActiveQueueItem()) {
    return queueItem;
  }
  return null;
}

// Listen for storage changes from other tabs
if (browser) {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      if (e.newValue) {
        try {
          queueItem = JSON.parse(e.newValue);
          console.log('[ChatTryOnQueue] Synced from other tab:', $state.snapshot(queueItem));
        } catch {
          queueItem = null;
        }
      } else {
        queueItem = null;
        console.log('[ChatTryOnQueue] Cleared from other tab');
      }
    }
  });
}
