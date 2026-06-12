# API layer

All backend HTTP goes through `src/lib/api/client.ts`. One client, eight resource modules, one error class, one barrel.

## Client (`src/lib/api/client.ts`)

```ts
api.get<T>(endpoint, options?, fetchFn?)
api.post<T>(endpoint, body, options?, fetchFn?)
api.put<T>(endpoint, body, options?, fetchFn?)
api.patch<T>(endpoint, body, options?, fetchFn?)
api.delete<T>(endpoint, options?, fetchFn?)
```

`endpoint` is appended to `API_ENDPOINTS.AI_INFLUENCER_BACKEND` (`PUBLIC_AI_INFLUENCER_BACKEND_URL`, ends in `/api/v1`). The optional `fetchFn` lets server load functions inject SvelteKit's `event.fetch`, but the influencer route deliberately uses global `fetch` to skip the `Origin` header (CORS).

What the client does on every call:

1. **Pre-flight refresh** (browser only): reads `userStore.accessTokenExpiry`. If `expired` or within 5 min of expiring, calls `authService.refreshToken()` before the request.
2. **Refresh dedup**: a module-level `refreshPromise` ensures only one refresh runs at a time; concurrent callers `await` the same promise (`client.ts:35`).
3. **Header injection**: `Content-Type: application/json` + `Authorization: Bearer ${userStore.accessToken}` if a token exists. Caller-supplied headers override.
4. **45 s timeout**: `signal: AbortSignal.timeout(45_000)` unless caller passes its own.
5. **401 fallback**: one-shot refresh + retry with the new token. If the second call still fails, throws `ApiError(401, 'Authentication expired')`.
6. **Error normalization**: any non-2xx throws `ApiError(status, message)`. Empty bodies throw `ApiError(status, 'API returned an error response')`.

The client never reports to Sentry directly — callers tag the operation when capturing.

## ApiError

```ts
export class ApiError extends Error {
  constructor(public status: number, message: string) { ... }
}
```

Surfaced in `+layout.server.ts` for slug routes — when `getInfluencerBySlug` throws `ApiError`, the handler converts it to SvelteKit `error(err.status, err.message)` so the slug-aware `+error.svelte` renders.

## Resource modules

| File | Endpoints | Notes |
| --- | --- | --- |
| `influencer.ts` | `getInfluencerBySlug` → `GET /influencers/:slug` (with `profileId`/`userId` query); `getSectionProducts` → `GET /influencers/:slug/sections/:sectionId/products` | SSR-friendly; both take optional `fetchFn`. Slug load called from `[slug]/+layout.server.ts` |
| `chat.ts` | `POST /influencers/chat/conversation`, `GET /influencers/chat/conversations`, `DELETE /influencers/chat/conversation`, `POST /influencers/chat/migrate` | Header `X-Influencer-Id` always; `X-Profile-Id` only on init (others read identity from Bearer). See @docs/chat-architecture.md |
| `tryon.ts` | `POST /influencers/tryon`, `GET /influencers/tryon/:jobId/status` | Polling helper: 12 attempts × 15 s = 3 min ceiling. `AbortSignal`-cancellable. See @docs/tryon-pipeline.md |
| `upload.ts` | `GET ${BIFROST}/api/upload/v1/upload-url`, raw `PUT` to returned signed URL, `POST /upload/signed-url` | **Bypasses `api.client`** — talks to Bifrost directly with raw `fetch`. Selfies are converted to JPEG via canvas before PUT |
| `user.ts` | `POST /customer/onboard` | Maps UI body-type strings (`Slim`, `Athletic`, `Average`, …) to API codes (`LEAN`, `MID`, `MID_PLUS`, …). Header `x-influencer-id: localStorage.influencer_id` |
| `collection.ts` | `POST /influencers/products/suggest-images` | Personalized "Selected for you" grid. Swallows errors and returns empty sections (`collection.ts:50`) |
| `creator.ts` | `POST /creator/apply`, `GET /creator/status/:instagramHandle` | Influencer applications |
| `myLooks.ts` | `GET /influencers/mylooks` | Header `X-User-Id` from caller. (`X-Profile-Id` is intentionally commented — backend reads from Bearer) |
| `index.ts` | barrel | Re-exports `api`, `ApiError`, `getInfluencerBySlug`, `getCollectionBySlug`, try-on helpers, creator helpers |
| `client.ts` | — | The shared `api` object + `ApiError` |

## Endpoints that bypass `api.client`

Several flows use raw `fetch` directly. **Don't migrate them to `api.client`** — auth orchestration depends on the bypass:

1. **Auth bootstrap & refresh** (`services/auth.ts`) → `POST /auth/token`, `POST /auth/refresh` (AI Influencer backend), `POST /api/v0/login/google`, `POST /api/v0/glance/auth/token/refresh`, `GET /api/v0/user`, `PATCH /api/v0/user` (Glance Account API). Going through `api.client` would recurse — the client's pre-flight refresh calls back into `services/auth.ts`.
2. **`getUserProfile`** (`services/auth.ts:931`) → `GET /customer/profile` on AI Influencer backend with `Bearer` + `x-influencer-id`. Same recursion concern — called inside `completeLogin`.
3. **Selfie upload** (`api/upload.ts`) → `PUBLIC_BIFROST_API_URL`. Different host, different auth shape (`Bearer` directly with `userStore.accessToken`, then a raw `PUT` to a signed URL).
4. **Server-side OAuth + profile routes** (`routes/api/auth/google/+server.ts`, `routes/api/user/profile/+server.ts`) — server-only `fetch`, no client involvement. Both currently superseded by client-side flow in `services/auth.ts` but left in place.

See @docs/auth-flows.md for token-shape contracts.

## Headers convention

| Header | Set by | Required for |
| --- | --- | --- |
| `Authorization: Bearer <token>` | `client.ts` automatically | Every authenticated AI Influencer call |
| `X-Influencer-Id: <id>` | Caller in `options.headers` | Chat conversation, try-on, my-looks |
| `X-Profile-Id: <profileId>` | Caller (chat init only) | `initConversation` only |
| `X-Conversation-Id: <id>` | Caller | `deleteConversation` |
| `X-User-Id: <accountId>` | Caller | `getMyLooks` |
| `X-Device-Identifier: <uuid>` | `services/auth.ts` | Guest auth (`POST /auth/token`, `POST /auth/refresh`) |
| `X-Client-Id: <clientId>` | `services/auth.ts` + server profile route | Glance Account API calls |

Lowercase `x-influencer-id` appears in `tryon.ts` and `user.ts` — backend accepts both. Don't normalize in PRs you weren't already touching.

## Error handling pattern

```ts
import { api, ApiError } from '$lib/api';
import * as Sentry from '@sentry/sveltekit';

try {
  const result = await api.get<MyType>('/some/endpoint');
} catch (err) {
  if (err instanceof ApiError && err.status === 404) {
    return null;          // expected miss
  }
  Sentry.captureException(err, { tags: { operation: 'my_feature_load' } });
  throw err;              // propagate everything else
}
```

Suppress only known statuses. Always tag the Sentry capture with a stable `operation` slug. Never log the raw token. See @docs/error-tracking.md.
