# Try-on pipeline

Two surfaces, one shared backend:

- **Page try-on** (Latest, Wardrobe, Collection drawer, etc.) — `composables/useTryOn.svelte.ts`.
- **Chat VTON** — sent as part of a chat message; chatStore manages the timer + result.

Both call the same `/influencers/tryon` endpoint, both read from `tryOnStore.svelte.ts`, both persist via the `pendingGenerations` map.

## Entry: `executeTryOn(item, influencerId)` (`useTryOn.svelte.ts:62`)

1. **Set loading + start timer.** `setTryOnLoading(itemId)`, write `expiryTime = now + 180 s`, register a 1 s `setInterval` that updates `tryOnStore.elapsedTimes[itemId]`.
2. **Persist intent.** `addPendingGeneration({ itemId, influencerId, startTime, expiryTime, status: 'pending', item })`. Persisted to localStorage by a debounced `$effect` (300 ms).
3. **Auth gate.** `checkUserAuth(item, influencerId)` (`utils/tryOnUtil.ts:38`) — branches:
   - Not logged in → `showLoginPopup()` + `setPendingLoginAction({ type: 'tryon', itemId, item, influencerId, collectionOpen, collectionMode, ... })`. The drawer state is captured so login-via-redirect can re-open the right view.
   - Logged in but no `profileImage` → `setOnboardingStep('selfie')` + `startOnboarding()` — selfie capture flow.
   - OK → fall through.
4. **Create + poll.** `createTryOnJobOnly(item, influencerId, analytics)` posts to `/influencers/tryon` with `{ selfieUrl, productImageUrl, metadata }`. On success, `pollExistingTryOnJob(jobId, signal)` polls `/influencers/tryon/<jobId>/status` (12 attempts × 15 s = 3 min hard cap; `api/tryon.ts:51`).
5. **Render.** `preloadImage(result.imageUrl)` first (smooth swap), then `setTryOnResult(itemId, imageUrl)` and `updatePendingGenerationStatus(itemId, 'completed')`. Pending entry removed 2 s later so the result has a window to read it during render.
6. **Stop timer.** Only when no other items are still loading (`tryOnStore.loadingTryOn` empty).

Failure at any step calls `resetTryOnItem(itemId)`, marks pending as `'failed'`, removes it, and shows a toast. Polling is `AbortSignal`-cancellable.

## TryOn request shape (`types/tryon.ts`)

```ts
{
  selfieUrl: userStore.profileImage,
  productImageUrl: item.image,
  metadata: {
    id: item.id,
    userId: userStore.accountId,
    profileId: userStore.profileId,
    gender: userStore.gender,
    productTitle: item.name,
    productType: item.type ?? 'clothing',
    influencerPersona: `${influencerId} style`,
    brandPersona: item.brandPersona ?? 'Fashion forward collection',
  }
}
```

Header: `x-influencer-id: <influencerId>`. Bearer auth via `api.post`.

## Persistence + cross-tab

`tryOnStore.svelte.ts:48` wires `pendingGenerations` and `timerData` through `createReactiveStorageSync` (`services/storageSync.ts`):

- `ai_influencer_tryon_pending_generations` — debounced JSON dump of all in-flight tries (300 ms write).
- `ai_influencer_tryon_timer_data` — start times, used to recompute elapsed time on reload.

On `init`, `cleanupExpiredGenerations` drops any entry past `expiryTime` or in status `'failed'`. Entries that were `'processing'` with a `jobId` get re-attached: `pollExistingTryOnJob(jobId)` resumes.

Browser tabs sync via `localStorage` `storage` events — open the same try-on in two tabs and both see the same timer.

## Gender mismatch (`utils/tryOnUtil.ts:95`)

`isGenderMismatch()` reads `localStorage.influencer_gender` (set by the influencer page on slug load) and compares to `userStore.gender`. Used to gate try-on UX for cross-gender content. Returns `false` for guests or users without a gender set — never blocks anonymous users.

## Deferred-action resume (login → try-on)

The hook is in two parts:

1. **Before login.** `executeTryOn` calls `setPendingLoginAction({ type: 'tryon', itemId, item, influencerId, collectionOpen, collectionMode, collectionSectionId, collectionInfluencerSlug })`. The collection drawer state is captured because the user might have triggered try-on from inside a drawer view that needs to re-open after login.
2. **After login.** `useTryOn.svelte.ts:348` mounts a module-level `$effect.root` that watches `loginStore.loginInProgress`, `userStore.isLoggedIn`, and `onboardingStore.isActive`. When the dust settles, it calls `consumeRestoredAction()` (in-memory relay set by `completeLogin`) and:
   - re-opens the collection drawer with the captured state, **or**
   - polls the DOM for `[data-item-id="<itemId>"]` (up to 30 attempts × 150 ms) and scrolls it into center view.
3. `pendingTryOn = { item, influencerId }` is then set, and a separate `$effect` re-runs `executeTryOn` once the auth/onboarding preconditions are satisfied. `onboardingAttempted` flag prevents the onboarding loop from retriggering.

For chat (`type: 'styleme'`), the resume path goes through `chatStore.setPendingStyleMe(product)` instead — the product is sent as a chat message after the user's selfie reply lands (see chat-architecture.md two-phase deferred product send).

## Chat VTON

Same backend endpoint, but the timer + result rendering happen **inside the chat message bubble**, not on a product card. `pendingGenerations[itemId].type === 'chat-vton'` distinguishes them, and `chatData: { messageId, sessionId, timerText }` carries the chat context. `markQueueProcessing()` (`chatTryOnQueue.svelte.ts:154`) is called as soon as the timer starts so other Style Me buttons in the same chat re-enable.

The chat queue (`ai_influencer_chat_tryon_queue`) holds **one** product max — preventing the user from kicking off a second VTON before the first writes its message. Stale items (older than 5 min in `waiting`/`processing`) are evicted on load.

## Constants

- `TOTAL_TIME_FOR_TRYON = 180` s — UI timer ceiling. Defined in `config/env.ts`.
- Backend polling: `maxAttempts = 12`, `intervalMs = 15000` — both tunable per call. Hardcoded defaults in `api/tryon.ts:51`.
- Pending-write debounce: `300 ms` (`tryOnStore.svelte.ts:92`).
