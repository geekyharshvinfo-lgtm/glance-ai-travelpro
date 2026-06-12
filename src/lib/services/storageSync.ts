/**
 * Storage Sync Service
 * Provides automatic synchronization between Svelte stores and browser storage
 */
import { browser } from '$app/environment';

type StorageType = 'localStorage' | 'sessionStorage';

interface StorageSyncOptions {
  storageType?: StorageType;
  serialize?: (value: unknown) => string;
  deserialize?: (value: string) => unknown;
  onError?: (error: Error) => void;
}

const defaultOptions: Required<StorageSyncOptions> = {
  storageType: 'localStorage',
  serialize: JSON.stringify,
  deserialize: JSON.parse,
  onError: (error) => console.error('[StorageSync]', error),
};

/**
 * Creates a storage sync handler for a specific key
 * @param key The storage key
 * @param options Storage sync options
 */
export function createStorageSync<T>(key: string, options?: StorageSyncOptions) {
  const opts = { ...defaultOptions, ...options };
  const storage = browser ? window[opts.storageType] : null;

  /**
   * Reads value from storage
   */
  function read(): T | null {
    if (!storage) return null;

    try {
      const stored = storage.getItem(key);
      if (stored === null) return null;
      return opts.deserialize(stored) as T;
    } catch (error) {
      opts.onError(new Error(`Failed to read ${key}: ${error}`));
      return null;
    }
  }

  /**
   * Writes value to storage
   */
  function write(value: T): boolean {
    if (!storage) return false;

    try {
      if (value === null || value === undefined) {
        storage.removeItem(key);
      } else {
        const serialized = opts.serialize(value);
        storage.setItem(key, serialized);
      }
      return true;
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        opts.onError(new Error(`Storage quota exceeded for ${key}`));
        // Try to clear expired data or old entries
        clearExpiredStorageEntries();
      } else {
        opts.onError(new Error(`Failed to write ${key}: ${error}`));
      }
      return false;
    }
  }

  /**
   * Removes value from storage
   */
  function remove(): void {
    if (!storage) return;
    storage.removeItem(key);
  }

  /**
   * Clears the specific storage type
   */
  function clear(): void {
    if (!storage) return;
    storage.clear();
  }

  return { read, write, remove, clear };
}

/**
 * Clears expired entries from localStorage to free up space
 */
function clearExpiredStorageEntries(): void {
  if (!browser) return;

  const now = Date.now();
  const keysToRemove: string[] = [];

  // Check all localStorage items for expired data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Skip non-ai-influencer keys
    if (!key.startsWith('ai_influencer_')) continue;

    try {
      const value = localStorage.getItem(key);
      if (!value) continue;

      const parsed = JSON.parse(value);

      // Check if data has expiry field
      if (parsed.expiry && parsed.expiry < now) {
        keysToRemove.push(key);
      }
    } catch {
      // Skip invalid JSON entries
    }
  }

  // Remove expired entries
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * Creates a reactive storage sync that automatically syncs with a Svelte store
 * @param key Storage key
 * @param initialValue Initial value if nothing in storage
 * @param options Storage sync options
 */
export function createReactiveStorageSync<T>(
  key: string,
  initialValue: T,
  options?: StorageSyncOptions
) {
  const sync = createStorageSync<T>(key, options);

  // Try to read from storage first
  const storedValue = sync.read();
  const value = storedValue !== null ? storedValue : initialValue;

  // Return both the initial value and the sync methods
  return {
    initialValue: value,
    sync,
  };
}
