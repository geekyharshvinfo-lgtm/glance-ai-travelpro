# Architecture

A SvelteKit SSR-on-Node app with three external integrations: an HTTP backend (Bifrost + Glance Account + AI Influencer), Firestore for real-time chat, and Sentinel for analytics. SSR fetches the influencer page data; the client takes over for auth, chat, try-on, and uploads.

## Layer map

```
[ Browser ]──HTTP──[ SvelteKit (Node) ]──HTTP──[ Glance backends ]
                       │   │   │                 ├ AI Influencer  /api/v1
                       │   │   └ /api/health     ├ Glance Account /api/v0
                       │   ├ /api/upload         ├ Bifrost        /api/upload/v1
                       │   ├ /api/download       └ google OAuth
                       │   ├ /api/auth/google
                       │   └ /api/user/profile
                       │
                       └─SSR load──/[slug]   (server-only)
                       └─CSR runes─chat / try-on / auth / sentinel
```

## Source map

| Layer | Files | Doc |
| --- | --- | --- |
| Routes / pages | `src/routes/**` | @docs/routing.md |
| API client + modules | `src/lib/api/**` | @docs/api-layer.md |
| State stores (runes) | `src/lib/stores/**` | @docs/state-management.md |
| Firebase init + chat | `src/lib/firebase/**` | @docs/firebase.md |
| Auth orchestration | `src/lib/services/auth.ts` | @docs/auth-flows.md |
| Try-on flow | `src/lib/composables/useTryOn.svelte.ts` | @docs/tryon-pipeline.md |
| Chat lifecycle | `src/lib/stores/chatStore.svelte.ts` | @docs/chat-architecture.md |
| Analytics (Sentinel) | `src/lib/utils/analytics.ts` + `constants/analytics.ts` | @docs/analytics.md |
| Error tracking | `hooks.client.ts`, `hooks.server.ts`, `instrumentation.server.ts` | @docs/error-tracking.md |
| Build/env/runtime | `scripts/`, `.env*`, `vite.config.ts` | @docs/environment.md |
| Deployment | `Dockerfile`, `deployment_values/`, `.github/workflows/` | @docs/deployment.md |

## App init sequence (browser)

1. SSR → `[slug]/+layout.server.ts` reads `ai_influencer_profile_id` / `ai_influencer_account_id` cookies, calls `getInfluencerBySlug(slug, undefined, { profileId, accountId })`, passes data to layout.
2. Hydration → root `+layout.svelte:onMount`:
   - `authService.initialize()` — restores Google tokens, otherwise restores guest token (or fetches a new one via `POST /auth/token`), then `resetAllTryOn()` to clear stale jobs from previous sessions. Resolves `authReady` regardless of outcome. See @docs/auth-flows.md.
   - `loadSentinel({ pageName: 'APP_INIT', ... })` — installs the queue stub, defers the SDK script. See @docs/analytics.md.
3. `[slug]/+layout.svelte` watches `userStore.authInitialized`; once true, fires `chatStore.prefetch(influencerId)` in the background. See @docs/chat-architecture.md.
4. `[slug]/+page.svelte:onMount` writes `localStorage.influencer_gender` and `localStorage.influencer_id`, then mounts `usePageTracking()` for Sentinel page-level events.

## Request paths

- **App backend** (`PUBLIC_AI_INFLUENCER_BACKEND_URL` ending `/api/v1`) — every authenticated client call goes through `$lib/api/client.ts` which auto-attaches `Authorization: Bearer <userStore.accessToken>`, refreshes 5 min before expiry, retries once on 401, 45 s timeout.
- **Glance Account** (`PUBLIC_GLANCE_ACCOUNT_API_URL`) — login + profile via `/api/v0`. Called from `services/auth.ts` directly (not through `api.client`) because it uses raw `Authorization: <token>` (no `Bearer`) and a different `X-Client-Id` header.
- **Bifrost upload** (`PUBLIC_BIFROST_API_URL`) — pre-signed URL provider for selfies. `api/upload.ts` GETs `/api/upload/v1/upload-url`, then PUTs the JPEG to the returned URL.
- **Google OAuth** — popup mode hits `accounts.google.com` directly via GSI; redirect mode lands on `/?code=...` and `+page.svelte` exchanges via `authService.loginWithGlance(code)`.

## Server-side surfaces

`src/routes/api/` is a thin proxy layer, **not** a full API. See @docs/routing.md for endpoint contracts. Highlights:
- `/api/health` — k8s liveness (returns `{status: 'ok'}`).
- `/api/download` — bearer-gated proxy that streams from `*.glance-cdn.com` with `Content-Disposition: attachment` (works around CORS for image saves).
- `/api/upload` — currently a **mock**: returns a fake `https://storage.glance-cdn.com/uploads/...` URL. Real uploads go to Bifrost from the client.
- `/api/auth/google`, `/api/user/profile` — server-side OAuth + profile helpers; only `/api/auth/google` reads a server-only secret (`GOOGLE_CLIENT_SECRET` from `process.env`).

## State boundaries

`userStore` (Google-or-guest tokens, profile, onboarding) is the only store that auth flows write to. Feature stores (`chatStore`, `tryOnStore`, `chatTryOnQueue`, etc.) read `userStore.accessToken` indirectly through `api.client.ts`. `clearAuth()` wipes everything except `deviceId`. See @docs/state-management.md.

## Tech invariants

- **Svelte 5 runes only.** No legacy `$:` blocks, no `writable()` stores. Stateful modules outside components use `*.svelte.ts`.
- **Mobile-only** container — `max-width: 475px`, `1rem` scales `clamp(14px, 3.884vw, 18px)` (`app.css`). Don't add desktop layouts.
- **Firebase is optional.** `FIREBASE_ENABLED` gates usage; all callers handle the disabled case.
- **Three Sentry init points** — `instrumentation.server.ts`, `hooks.client.ts`, `vite.config.ts` (sourcemap upload). Don't collapse them. See @docs/error-tracking.md.
