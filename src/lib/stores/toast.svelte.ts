/**
 * Toast notification store using Svelte 5 runes
 * Manages global toast messages with queue support
 */

export interface Toast {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

let toasts = $state<Toast[]>([]);
let toastIdCounter = 0;

/**
 * Show a toast notification
 */
export function showToast(message: string, type: Toast['type'] = 'info', duration = 3000): string {
  const id = `toast-${++toastIdCounter}`;
  const toast: Toast = {
    id,
    message,
    type,
    duration,
  };

  toasts = [...toasts, toast];
  return id;
}

/**
 * Remove a toast by ID
 */
export function removeToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
}

/**
 * Clear all toasts
 */
export function clearToasts(): void {
  toasts = [];
}

// Export reactive store
export const toastStore = {
  get toasts() {
    return toasts;
  },
  show: showToast,
  remove: removeToast,
  clear: clearToasts,
};
