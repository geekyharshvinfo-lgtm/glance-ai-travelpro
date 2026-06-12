/**
 * Login Intent — persists the user's pre-login context across a full-page
 * OAuth redirect so deferred actions (try-on, chat messages, etc.) can
 * resume after authentication completes.
 *
 * Uses sessionStorage: dies with the tab, no cross-tab leakage, no stale
 * state across sessions.
 */

import { browser } from '$app/environment';

const STORAGE_KEY = 'ai_influencer_login_intent';
const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export interface LoginIntent {
  /** Page to navigate back to after login completes */
  returnUrl: string;
  /** Deferred action that triggered the login */
  action?: LoginIntentAction;
  /** Timestamp for staleness check */
  timestamp: number;
}

export type LoginIntentAction =
  | {
      type: 'tryon';
      itemId: string;
      influencerId: string;
      item: SerializedTryOnItem;
      /** Re-open the collection drawer after login (product was in the drawer) */
      collectionOpen?: boolean;
      /** Drawer mode when collectionOpen is true */
      collectionMode?: 'collection' | 'productGrid';
      /** Section ID for productGrid mode restoration */
      collectionSectionId?: string;
      /** Influencer slug for productGrid mode restoration */
      collectionInfluencerSlug?: string;
    }
  | { type: 'styleme'; product: SerializedProduct };

/** Serializable product shape — includes all fields needed by sendProductSelection downstream */
export interface SerializedProduct {
  id: string;
  ppid: string;
  imageUrl: string;
  brand: string;
  price: string;
  cta: { text: string; url: string };
  message?: string;
  gender?: string;
}

export interface SerializedTryOnItem {
  id: string;
  image: string;
  name?: string;
  title?: string;
  type?: string;
  brandPersona?: string;
}

/**
 * Module-level pending action — set by the code that triggers login
 * (e.g., useTryOn, ChatProductCards) so triggerGoogleLogin can include
 * it in the intent without prop-threading through popup components.
 */
let pendingAction: LoginIntentAction | undefined;

export function setPendingLoginAction(action: LoginIntentAction): void {
  pendingAction = action;
}

export function consumePendingLoginAction(): LoginIntentAction | undefined {
  const action = pendingAction;
  pendingAction = undefined;
  return action;
}

export function saveLoginIntent(returnUrl: string, action?: LoginIntentAction): void {
  if (!browser) return;

  const intent: LoginIntent = { returnUrl, timestamp: Date.now(), action };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
}

export function getLoginIntent(): LoginIntent | null {
  if (!browser) return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const intent: LoginIntent = JSON.parse(raw);

    // Discard stale intents
    if (Date.now() - intent.timestamp > MAX_AGE_MS) {
      clearLoginIntent();
      return null;
    }

    return intent;
  } catch {
    clearLoginIntent();
    return null;
  }
}

export function clearLoginIntent(): void {
  if (!browser) return;
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * In-memory relay for the intent action across the goto() boundary.
 * completeLogin clears the sessionStorage intent immediately (preventing
 * stale re-reads) and stashes the action here. useTryOn's $effect
 * consumes it after the page mounts on the return URL.
 */
let restoredAction: LoginIntentAction | undefined;

export function setRestoredAction(action: LoginIntentAction): void {
  restoredAction = action;
}

export function consumeRestoredAction(): LoginIntentAction | undefined {
  const a = restoredAction;
  restoredAction = undefined;
  return a;
}
