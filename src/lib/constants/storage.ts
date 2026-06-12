/**
 * Storage keys for localStorage and sessionStorage
 */

// Try-on related storage keys
export const TRYON_PENDING_GENERATIONS = 'ai_influencer_tryon_pending_generations';
export const TRYON_GENERATION_DATA = 'ai_influencer_tryon_generation_data';
export const TRYON_TIMER_DATA = 'ai_influencer_tryon_timer_data';

// User profile storage keys (blob persisted by $effect in user.svelte.ts)
export const USER_STORAGE_KEY = 'ai_influencer_user';
export const USER_ACCESS_TOKEN_KEY = 'ai_influencer_access_token';
export const USER_REFRESH_TOKEN_KEY = 'ai_influencer_refresh_token';
export const USER_TEMP_SELFIE_KEY = 'ai_influencer_temp_selfie';

// Device and session keys
export const DEVICE_ID_KEY = 'ai_influencer_device_id';
export const SESSION_ID_KEY = 'ai_influencer_session_id';

// Chat conversation cache keys
export const CHAT_CONV_PREFIX = 'chat_conv_';

export function getGuestChatCacheKey(influencerId: string): string {
  return `${CHAT_CONV_PREFIX}guest_${influencerId}`;
}

// Onboarding keys
export const ONBOARDING_COMPLETED_KEY = 'ai_influencer_onboarding_completed';
