# Auth flows

Three coexisting tokens, one user store, one HTTP client that knows how to refresh.

## Token sources

| Token | Issuer | Used for | Expiry | Storage |
| --- | --- | --- | --- | --- |
| **Guest** | App backend `POST /auth/token` (device-id keyed) | Anonymous Bearer for backend APIs | 1 h | `localStorage.ai_influencer_guest_token` (JSON: `accessToken`, `userId`, `expiresAt`, `firestoreToken`) |
| **Glance access / refresh** | `/api/v0/login/google` (Glance Account API) | Authenticated Bearer for backend APIs | 1 h / 30 d | `localStorage.ai_influencer_{access,refresh}_token{,_expiry}` |
| **Firebase custom token** | `POST /influencers/chat/conversation` (per-conversation) | Sign in to Firebase Auth → read/write Firestore chat | session | IndexedDB (Firebase SDK) |

`userStore.authType` is `'guest' | 'google' | null`. `userStore.isLoggedIn` is **only** true for `'google'` — guests are treated as anonymous.

## Init sequence (every page load)

`src/routes/+layout.svelte` calls `authService.initialize()` on mount (`src/lib/services/auth.ts:78`). It:

1. Reads stored Google tokens from localStorage. Found → `setAuthTokens()` and resolves `authReady`.
2. Otherwise reads stored guest token. Found and not expired → `setGuestAuth()`.
3. Otherwise calls `POST /auth/token` with `X-Device-Identifier: <userStore.deviceId>` (`crypto.randomUUID()` generated on first visit, persisted in `ai_influencer_device_id`).
4. Always calls `setAuthInitialized()` at the end so `authReady` resolves even on failure. Downstream consumers (`chatStore.prefetch`, etc.) `await authReady` before making API calls.

## Google OAuth (interactive login)

Two modes, picked by user-agent (`src/lib/utils/googleAuth.ts:70`):

- **Popup mode** (normal browsers): GSI `ux_mode: 'popup'`, code lands in `handlePopupAuthCode` → `authService.loginWithGlance(code)`.
- **Redirect mode** (in-app WebViews): GSI `ux_mode: 'redirect'`, full-page navigate to `/?code=...`. `routes/+page.svelte` calls `loginWithGlance` from `onMount`. UA pattern: `Instagram|FBAV|FBAN|FB_IAB|TikTok|BytedanceWebview|Snapchat` AND iOS or Android. The `?force_redirect` URL param overrides detection — useful for testing redirect mode in normal browsers.

The GSI script (`https://accounts.google.com/gsi/client`) is loaded **on demand** from `triggerGoogleLogin()` — never on page load. ~80 KB savings for users who don't sign in.

Before triggering redirect, `triggerGoogleLogin()` calls `saveLoginIntent(window.location.pathname + search, action)` — sessionStorage entry with 10 min TTL. After firing `client.requestCode()`, a 3-second `setTimeout` resets `loginInProgress` in case the user dismisses the Google page (the redirect-mode `callback` is a no-op since the page navigates away anyway).

If GSI fails to load on Android in-app WebViews, `triggerGoogleLogin()` falls back to opening the current URL in the system browser via `intent://...#Intent;scheme=https;action=android.intent.action.VIEW;end`.

`loginWithGlance` flow (`auth.ts:148`):

1. `POST /api/v0/login/google?code=...&client_id=AUTH_CLIENT_ID&grant_type=authorization_code` → access + refresh tokens.
2. `getAccountInfo(accessToken)` (`/api/v0/user`). If `age` is missing, show `AgeConsentPopup` and stash tokens in `loginStore.loginTokenData`. Otherwise `completeLogin(authData)`.
3. After age PATCH, `loginStore.loginTokenData` becomes the input to `completeLogin`.

`completeLogin()` (`auth.ts:275`):

- Clears any guest token, persists Google tokens to localStorage and `userStore`.
- `Sentry.setUser({ id: profileId, email, username })` and tag `auth_type=google`.
- `getUserProfile()` from app backend (`/customer/profile`) → `applyUserProfileData()` populates onboarding fields (selfie, gender, body type).
- `migrateChatConversation()` — see chat-architecture.md.
- `closeLoginPopup()` → reset login state.
- `setProfileCookies()` writes `ai_influencer_profile_id` and `ai_influencer_account_id` (30 d, SameSite=Lax). Server-side `+layout.server.ts` reads these to personalize SSR fetches.
- Reads sessionStorage intent. **Clears it immediately** to prevent stale re-reads, stashes the action via `setRestoredAction()` (in-memory relay), then `goto(returnUrl, { invalidateAll: true })`.

## Token refresh

`src/lib/api/client.ts` checks expiry on every request:

- 5 min before `accessTokenExpiry` → preemptive refresh.
- After expiry → forced refresh.
- 401 response → one-shot fallback refresh + retry.

Concurrent refreshes share one in-flight `Promise<boolean>` (`refreshPromise` at `client.ts:35`) — never two refreshes in parallel.

`authService.refreshToken()` dispatches by `authType`:

- **Guest** (`auth.ts:613`): `POST /auth/refresh` with `Bearer <currentToken>` + `X-Device-Identifier` + `X-Influencer-Id` (read from `localStorage.influencer_id`). On failure, falls back to a fresh `loginAsGuest()`.
- **Google** (`auth.ts:671`): `POST /api/v0/glance/auth/token/refresh` with `Authorization: <refreshToken>` (no `Bearer`) + `X-Client-Id`. On failure, clears stored tokens (forces re-login).

## Firebase custom token

Scoped per conversation, not per user. `chatStore.initChatCore` calls `initConversation(influencerId)` (which is gated by Bearer token), receives `{ path, token }`, then `signInWithCustomToken(token)`.

`waitForAuthReady()` (`firebase/auth.ts`) is the bridge for page-refresh boundaries: Firebase SDK restores session from IndexedDB asynchronously, so `auth.currentUser` is null synchronously even when a session exists. The function returns a single shared promise (5 s timeout) that all callers reuse.

## Deferred-action pattern (login-gated UX)

Code that triggers login from a button calls `setPendingLoginAction({ type, ... })` **before** `showLoginPopup()`. The action lives module-level in `loginIntent.ts`.

For redirect-mode logins, `triggerGoogleLogin()` consumes the pending action, merges it into the sessionStorage intent, and saves both `returnUrl` and `action`. After OAuth completes, `completeLogin()` calls `setRestoredAction()` (in-memory) and `goto(returnUrl)`.

A page-mounted `$effect.root` (e.g. `useTryOn.svelte.ts:348`) watches `userStore.isLoggedIn` and calls `consumeRestoredAction()` once login settles — replays the try-on, re-opens the collection drawer, scrolls to the product. See tryon-pipeline.md.

`closeLoginPopup()` calls `consumePendingLoginAction()` to drain the pending action — if the user cancels, the deferred action is dropped.

## Logout (`auth.ts:534`)

1. Clear stored tokens (guest + Google).
2. Clear `ai_influencer_profile_id` / `ai_influencer_account_id` cookies.
3. `clearAuth()` — wipe `userStore` (preserves `deviceId`).
4. `resetAllTryOn()`, `clearPendingTryOn()`, `clearChatTryOnQueue()`.
5. `closeLoginPopup()`.
6. `firebase/auth.signOut()` — required, otherwise next chat init reuses old user's Firebase session from IndexedDB.
7. `chatStore.fullReset()` then re-login as guest. Order matters — guest auth triggers chat prefetch that `fullReset()` would otherwise wipe.
8. `invalidateAll()` to re-fetch SSR data without user context.

## Storage keys (canonical)

- `ai_influencer_device_id` — UUID, never cleared.
- `ai_influencer_access_token`, `_refresh_token`, `_access_token_expiry`, `_refresh_token_expiry` — Google tokens.
- `ai_influencer_guest_token` — JSON blob for guest token.
- `ai_influencer_user` — single JSON blob auto-persisted by `$effect` in `user.svelte.ts` (profile + onboarding fields, **not** tokens).
- `ai_influencer_login_intent` — sessionStorage, OAuth-redirect intent, 10 min TTL.
- `influencer_id`, `influencer_gender` — written when navigating to a slug; used by guest refresh and gender-mismatch checks.
