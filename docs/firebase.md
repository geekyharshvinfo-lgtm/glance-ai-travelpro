# Firebase

Lazy-init Firestore + Auth, with a hard kill-switch (`FIREBASE_ENABLED`). Three files: `index.ts` (init), `auth.ts` (custom-token sign-in + restore), `chat.ts` (Firestore reads/writes).

## Files

| File | Exports |
| --- | --- |
| `src/lib/firebase/config.ts` | `firebaseConfig`, `FIREBASE_ENABLED` (re-exported from `$lib/config/env`) |
| `src/lib/firebase/index.ts` | `getFirestoreInstance()`, `getAuthInstance()`, `isFirebaseAvailable()`, `getInitializationError()` |
| `src/lib/firebase/auth.ts` | `signInWithCustomToken(token)`, `waitForAuthReady()`, `onAuthStateChanged(cb)`, `signOut()`, `isAuthAvailable()` |
| `src/lib/firebase/chat.ts` | `firestoreDocToMessage`, `subscribeToMessagesAtPath`, `sendMessageToPath`, … (chat-specific Firestore IO) |

## FIREBASE_ENABLED

Computed in `$lib/config/env.ts`:

```ts
export const FIREBASE_ENABLED = Boolean(
  FIREBASE_CONFIG.apiKey &&
  FIREBASE_CONFIG.authDomain &&
  FIREBASE_CONFIG.projectId &&
  FIREBASE_CONFIG.appId
);
```

If any of those four env vars is empty, Firebase is disabled and:
- `getFirestoreInstance()` and `getAuthInstance()` return `null`.
- `chatStore` falls back to local-only mode (no real-time sync).
- `authStore` (`stores/authStore.svelte.ts:29`) generates a synthetic `local-<timestamp>-<rand>` user so the rest of the UI doesn't choke on null.

All callers must handle the null case. Don't assume `getFirestoreInstance() !== null`.

## Lazy init

`index.ts` keeps three module-level singletons: `app`, `db`, `auth`. `initializeFirebase()` is idempotent and called from `getFirestoreInstance` / `getAuthInstance` on first access. If init throws once, `initializationError` is sticky — subsequent calls return `null` without retrying. The thrown error is reported to Sentry with `tags: { operation: 'firebase_init' }`.

## Custom token auth

Each chat conversation has its own Firebase token, issued by the backend's `POST /influencers/chat/conversation` endpoint (`api/chat.ts:initConversation`). The flow:

1. `chatStore.initChatCore` calls `initConversation(influencerId)` which is gated by the userStore Bearer token.
2. Backend returns `{ path, token }` — the path is `conversations/<id>/messages`, the token is a one-time Firebase custom token.
3. `signInWithCustomToken(token)` (`firebase/auth.ts:22`) hands it to Firebase Auth. On success, returns `{ uid, isAnonymous }`.
4. Firebase persists the session in IndexedDB. Subsequent page reloads restore the session asynchronously.

`signOut()` is required during logout — without it, the next chat init would reuse the previous user's IndexedDB session. See `services/auth.ts:logout` step 6 in @docs/auth-flows.md.

## waitForAuthReady — the IndexedDB race

```ts
const AUTH_READY_TIMEOUT_MS = 5000;
let authReadyPromise: Promise<FirebaseUser | null> | null = null;

export function waitForAuthReady(): Promise<FirebaseUser | null> { ... }
```

On a fresh page load Firebase restores the session from IndexedDB asynchronously. `auth.currentUser` is `null` synchronously even when there's a valid session. `waitForAuthReady()` solves this:

- If `currentUser` is already set → resolves immediately.
- Otherwise → registers `firebaseOnAuthStateChanged`, resolves on the first callback (or null if it never fires).
- Concurrent callers share one promise (memoized in `authReadyPromise`).
- 5 s timeout — IndexedDB is local but slow devices / corrupted storage shouldn't hang the chat init.
- Memoization clears via `.then()` after the promise settles, so the next reload starts fresh.

This is the bridge `chatStore` uses on warm navigations to skip a fresh `initConversation` call.

## Schema

The Firestore schema mirrors the `glance-ai-embed` project's format directly — there's no conversion layer. `firestoreDocToMessage()` (`firebase/chat.ts:395`) parses two coexisting formats:

- **New** — `data: [{ type, content: [...] }]`, items collapsed into `MessageI.content`.
- **Legacy** — `content` as object/string, `type/sender/status` at top level.

When the new format ships fully, drop the legacy branch. See @docs/chat-architecture.md for the full message-type taxonomy and view-state machinery.

## Firestore client config

`getFirestore(app)` is called with no arguments — default settings, default region. There's no offline persistence enabled. Long-polling is auto-detected by the SDK.

## Bundle hygiene

`vite.config.ts:49` returns `undefined` from `manualChunks` for `firebase` and `esm-env` because both produce empty chunks after tree-shaking when Firebase is enabled and a noisy warning when disabled. Don't re-add them — adding them back broke the production build at one point and the empty-chunk warnings became actionable.

The `authStore` uses `await import('$lib/firebase/auth')` to lazy-load the Firebase SDK only when `FIREBASE_ENABLED` is true. This shaves Firebase entirely from the initial bundle for environments that disable it.

## Error reporting

Every Firebase code path that fails reports to Sentry with one of these operation tags:

- `firebase_init`, `firestore_init`, `firebase_auth_init` — bootstrap failures.
- `firebase_custom_token_signin` — `signInWithCustomToken` rejected.
- See `firebase/chat.ts` for chat-specific tags (`firebase_chat_send`, etc.).

`signOut()` swallows errors silently — the user-facing logout path is best-effort. Don't add a tag there.
