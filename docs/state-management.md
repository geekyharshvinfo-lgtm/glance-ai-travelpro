# State management

Svelte 5 runes only. Stateful modules outside components live in `*.svelte.ts` files. 15 stores under `src/lib/stores/`. No legacy `writable()`. No `$:` reactive blocks.

## The store catalogue

| Store | Lines | Purpose | Cross-tab |
| --- | --- | --- | --- |
| `user.svelte.ts` | 217 | **Source of truth** for auth + profile. Single localStorage blob, $effect.root persistence | localStorage blob |
| `chatStore.svelte.ts` | 1433 | Firestore subscription, message list, conversation cache, ban state, pending product/style-me state. See @docs/chat-architecture.md | per-profile cache |
| `tryOnStore.svelte.ts` | 319 | Active try-on jobs, timers, pending generations (debounced persist). See @docs/tryon-pipeline.md | yes (storage event) |
| `chatTryOnQueue.svelte.ts` | 229 | Single-slot Style Me queue. 5 min stale TTL, cleared on processing | yes (storage event) |
| `authStore.svelte.ts` | 116 | **Firebase** auth state — separate from `userStore`. Local user fallback when Firebase disabled | no |
| `onboarding.svelte.ts` | 90 | Selfie / gender / body-type wizard state | no |
| `login.svelte.ts` | 71 | Login popup visibility + age-consent gate + token data hand-off to `completeLogin` | no |
| `collectionDrawer.svelte.ts` | 60 | Drawer mode (`collection` / `productGrid`), selected product, hero image | no |
| `toast.svelte.ts` | 54 | Toast queue (`info` / `success` / `error` / `warning`) with auto-dismiss | no |
| `navigationStore.svelte.ts` | 44 | Cross-page selected product + hero image (used by drawer restore) | no |
| `reverseSearch.svelte.ts` | 31 | Image-based search input file + GCS URL + signed URL | no |
| `profile.svelte.ts` | 25 | Profile dropdown open state | no |
| `cameraOverlay.svelte.ts` | 23 | Camera popup state with `isReverseSearch` flag | no |
| `chatContext.svelte.ts` | 23 | Currently-attached product (chat input preview) | no |
| `chatHistoryStore.svelte.ts` | 18 | History drawer open + influencerId | no |

## userStore — the canonical pattern

Everything new should follow this shape (`user.svelte.ts`):

```ts
export const userStore = $state<UserStore>({ /* fields */ });

// Helpers mutate the store directly
export function setAuthTokens(...) { userStore.authType = 'google'; ... }
export function clearAuth() { /* reset all fields except deviceId */ }

// Promise that resolves once initialization completes — for async consumers
export const authReady = new Promise<void>((r) => { authReadyResolve = r; });
export function setAuthInitialized() { userStore.authInitialized = true; authReadyResolve(); }

// Single-blob persistence via $effect.root
$effect.root(() => {
  $effect(() => {
    if (!browser) return;
    const snapshot = getPersistedSnapshot();
    if (snapshot.accountId != null || snapshot.profileId != null) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  });
});

// Hydrate at module-init
if (browser) { /* read USER_STORAGE_KEY, restore non-null fields */ }
```

Key invariants:
- `authReady` is a one-shot — no re-resolves.
- `clearAuth()` preserves `deviceId` (it's device-level, not user-level).
- `getPersistedSnapshot()` is the single source of truth for persisted fields — the hydration block reads its keys.
- The persist `$effect` deletes the key when all profile fields are null (post-logout).

## tryOnStore — debounced persist + cross-tab

`tryOnStore` and the standalone `pendingGenerations` map use `createReactiveStorageSync` from `services/storageSync.ts`. The persist `$effect` is wrapped in 300 ms `setTimeout` debounce (`tryOnStore.svelte.ts:82`) because polling generates many status transitions.

Cross-tab: a `window.addEventListener('storage', ...)` handler at module init reads incoming changes from other tabs, replaces local state, and re-applies completed results. The `chatTryOnQueue` follows the same pattern but with a simpler scalar slot.

## Storage keys

Centralized in `src/lib/constants/storage.ts`:

```
ai_influencer_device_id              UUID, never cleared
ai_influencer_user                   blob: profile + onboarding (no tokens)
ai_influencer_access_token           Google access token (services/auth)
ai_influencer_refresh_token          Google refresh token
ai_influencer_access_token_expiry    ms timestamp
ai_influencer_refresh_token_expiry   ms timestamp
ai_influencer_guest_token            JSON {accessToken, userId, expiresAt, firestoreToken}
ai_influencer_login_intent           sessionStorage, OAuth-redirect intent (10 min TTL)
ai_influencer_tryon_pending_generations  per-job state (debounced 300 ms)
ai_influencer_tryon_timer_data       start times for elapsed-time recompute
ai_influencer_chat_tryon_queue       single Style Me slot (5 min stale TTL)
ai_influencer_temp_selfie            in-flight onboarding selfie blob URL
ai_influencer_onboarding_completed   bool flag
ai_influencer_profile_id             cookie (30 d, SameSite=Lax)
ai_influencer_account_id             cookie (30 d, SameSite=Lax)
chat_conv_<profileId|guest>_<influencerId>   conversation cache (24 h)
chat_warnings_<conversationId>       chat warning counter (per conversation)
chat_session_end_<profileId>_<influencerId>  chat ban (JSON {reason, restoreAt})
influencer_id                        last-visited slug (used by guest refresh)
influencer_gender                    last-visited gender (used by gender-mismatch gate)
cookieConsentAcknowledged            bool flag (only non-prefixed app key)
```

`storage.ts` also exports `TRYON_GENERATION_DATA` (`ai_influencer_tryon_generation_data`) and `SESSION_ID_KEY` (`ai_influencer_session_id`). Both are declared but never written or read by the rest of the code today — safe to delete in a follow-up PR.

Add new keys to `storage.ts` and prefix `ai_influencer_` so the global expiry-eviction sweep in `storageSync.ts:97` can clean them.

## Composables

Stateful runes that need to live outside components — for example to coordinate cross-mount state — go in `src/lib/composables/`:

- `useTryOn.svelte.ts` — module-level `pendingTryOn` + `$effect.root` watching `userStore.isLoggedIn` + `onboardingStore.isActive`. See @docs/tryon-pipeline.md.
- `usePageTracking.svelte.ts` — adds Sentinel `PAGE_START` / `PAGE_END` events plus visibility + horizontal-swipe listeners. Cleans up on `onDestroy`. See @docs/analytics.md.

## Don'ts

- Don't read `userStore.accessToken` directly inside business code — use `api.client`. Direct reads bypass refresh and will break when a token expires mid-session.
- Don't add a barrel for `stores/`. Import each store by file (`$lib/stores/chatStore.svelte`) — keeps circular-dep risk visible.
- Don't add new persistence shapes inline — go through `createReactiveStorageSync` or follow the `userStore` `$effect.root` pattern.
- Don't write to `pendingGenerations` from outside `tryOnStore.svelte.ts` — the debounced persist won't see partial updates.
