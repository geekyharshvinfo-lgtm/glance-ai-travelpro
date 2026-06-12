# Analytics (Sentinel)

Sentinel is Inmobi/Glance's product analytics SDK. It's loaded as a deferred remote script and exposes a global `window.Sentinel` that batches events to `/api/v2/analytics/web/log`.

This is **separate** from Sentry — Sentry handles errors and traces, Sentinel handles user behavior.

## Files

- `src/lib/utils/analytics.ts` — `loadSentinel`, `trackEvent`, `getAnalyticsData`, `getSentinelData`, `updateSentinelUserId`.
- `src/lib/constants/analytics.ts` — every event name, key, page, section, action constant. Use these, never raw strings.
- `src/lib/types/analytics.ts` — `AnalyticsEventActionType`, `EventData`, `TrackingConfig`, `CustomContext`.
- `src/app.d.ts:16` — typed `window.Sentinel` declaration.

## Loading

`+layout.svelte:onMount` calls `loadSentinel({ pageName: 'APP_INIT', url, referrer })` exactly once.

`loadSentinel` (`utils/analytics.ts:151`) runs in two phases:

1. **Stub phase.** Synchronously installs `window.Sentinel = { config, _q: [], trackEvent: (action, data) => _q.push([action, data, Date.now()]) }`. Any `window.Sentinel.trackEvent(...)` calls before the script loads queue into `_q`.
2. **Script phase.** Appends `<script defer src="https://trends.glance.com/sentinel/version/sentinel-v0.0.52.js">`. The script replaces the stub with the real SDK, which drains `_q`.

Bumping the SDK version means changing the URL — there's no version manifest.

A second queue (`pendingEvents` at `analytics.ts:9`) catches events fired **before** the stub is installed (e.g. very early renders during hydration). `processPendingEvents()` flushes it once `window.Sentinel` exists.

## Sentinel config (initialized inline)

```ts
{
  endpoint: SENTINEL_CONFIG.ENDPOINT,        // PUBLIC_SENTINEL_ENDPOINT
  apiKey: SENTINEL_CONFIG.API_KEY,           // PUBLIC_SENTINEL_API_KEY
  app: 'ai_embed_pwa',                       // SENTINEL_CONFIG.APP_NAME — fixed
  userId: userStore.deviceId || '',          // device-level until login
  autoTrack: { clicks: true, errors: true, performance: true, scrolling: true, swipes: false, visibility: true, ping: false },
  firstBatchDelay: 3000,
  batchSize: 10,
}
```

`autoTrack.clicks: true` means Sentinel auto-instruments any element with a `data-sentinel="..."` attribute — see `getSentinelData()` for the helper that builds it.

## `trackEvent(action, data)`

```ts
import { trackEvent } from '$lib/utils/analytics';
import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES } from '$lib/constants/analytics';

trackEvent(AnalyticsEventAction.CLICKED, {
  [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
  [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.TRY_ON_INITIATED,
  [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PRODUCT_PAGE,
  [ANALYTICS_EVENT_KEYS.productId]: item.id,
  [ANALYTICS_EVENT_KEYS.jobId]: jobResponse.jobId,
});
```

`getAnalyticsData()` is auto-merged into every payload, so you never pass these by hand:

- `time`, `eventName: 'ai_embed_pwa'`, `url`, `referrer`
- `userInfo: { userId: accountId, profileId, email, name, gender, age }`
- `userAuth: { isLoggedIn, authType }`

`removeNullAndUndefined()` strips empty fields recursively before send — keeps payloads compact.

## Event taxonomy (constants/analytics.ts)

Five enums. **Always reference these — never inline a string.**

| Constant | Purpose | Examples |
| --- | --- | --- |
| `AnalyticsEventAction` | The verb (top-level event action) | `CLICKED`, `RENDERED`, `VIEWED`, `MESSAGE_RECEIVED`, `SESSION_START`, `PAGE_LOAD`, `SWIPE` |
| `ACTION_TYPES` | Coarser-grained category | `USER_INTERACTION`, `CLICK`, `VIEW`, `RENDER`, `CHAT_MESSAGE_SENT`, `CHAT_MESSAGE_RECEIVED` |
| `EVENT_TYPES` | The "what happened" — most-used field | `TRY_ON_INITIATED`, `TRY_ON_SUCCESS`, `TRY_ON_FAILED`, `AUTH_LOGIN_SUCCESS`, `BUY_BUTTON_CLICK`, `CHAT_STARTER_TILE_CLICK`, ... |
| `PAGE_NAMES` | Page label | `HOME_PAGE`, `COLLECTION_PAGE`, `PRODUCT_PAGE`, `CHAT_PAGE`, `PROFILE_PAGE`, `AUTH_PAGE`, ... |
| `SECTION_NAMES` | Section within a page | `HERO`, `EDITORIAL`, `LOOK_COLLECTION`, `WARDROBE` (`PRODUCT_GRID`), `CHAT`, ... |
| `PERFORMANCE_EVENT_ACTIONS` | SDK / lifecycle | `SENTINEL_LOADED`, `SENTINEL_ERROR`, `CHAT_OPENED`, `PROFILE_OPENED` |
| `STATUS` | Outcome | `SUCCESS`, `FAILED` |

`ANALYTICS_EVENT_KEYS` enumerates every key name we put on a payload — `action`, `section`, `eventType`, `pageName`, `productId`, `jobId`, `tryOnDuration`, `loginMethod`, `errorMessage`, etc. Building event payloads with these keys keeps schemas consistent across producers.

## Declarative click tracking

For elements that just need a click event:

```svelte
<button data-sentinel={getSentinelData(
  { track: { click: true } },
  PAGE_NAMES.PRODUCT_PAGE,
  { eventType: EVENT_TYPES.BUY_BUTTON_CLICK, productId: id }
)}>
  Buy
</button>
```

Sentinel's `autoTrack.clicks` reads the attribute and emits the event without needing an `onclick` handler.

## User identity

`updateSentinelUserId(userId)` mutates `window.Sentinel.config.userId` after login. The stub initializes `userId` to `deviceId` (anonymous). The `+layout.svelte` `$effect` that calls it is **currently commented out** — see `routes/+layout.svelte:58`. If you re-enable it, drop in `updateSentinelUserId(userStore.accountId)` whenever `accountId` changes.

## usePageTracking composable

`src/lib/composables/usePageTracking.svelte.ts` wraps four event categories in one mount:

- `PAGE_START` (on mount) and `PAGE_END` (on destroy) with `timeOnPage` / `timeOnPageSeconds` — every page that calls `usePageTracking({ pageName, section?, metadata? })` from `onMount` gets these for free.
- `PAGE_HIDDEN` / `PAGE_VISIBLE` from a `visibilitychange` listener.
- `HORIZONTAL_SWIPE` from `touchstart` + `touchend` listeners. Thresholds: `|deltaX| > 50px`, `|deltaX| > |deltaY|`, `duration < 500ms`. Direction = `'left'` / `'right'`. Swipe attribution walks up from the touch target looking for `[data-section-name]` or `[data-section-type]`. The `[slug]/+page.svelte` wraps each section in `<div data-section-name="<title|type>">` so swipes get section-attributed.

Cleanup happens in `onDestroy` — the composable removes its listeners.

## Don't double-fire

Several flows fire events from multiple sites — be careful before adding more:

- **Try-on**: `tryOnUtil.ts` fires `TRY_ON_INITIATED` / `SUCCESS` / `FAILED`. `useTryOn.svelte.ts` calls into those, so don't add a parallel event in callers.
- **Auth**: `auth.ts` and `googleAuth.ts` both fire login events at different stages (`AUTH_LOGIN_INITIATED` from the trigger, `AUTH_LOGIN_SUCCESS` from `completeLogin`, `AUTH_LOGIN_FAILED` from any failure path). Keep new auth events at the same boundary.
- **Chat**: `MESSAGE_RECEIVED` fires inside `firestoreDocToMessage` for every parsed Firestore doc — this includes re-parses on update. If you need a "first received" signal, gate on `change.type === 'added'` at the subscription level.
