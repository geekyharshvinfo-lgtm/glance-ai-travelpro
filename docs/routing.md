# Routing

SvelteKit file-based routing. Five page routes, five API endpoints, two layouts. Default branch `master`, output to `./build` via `@sveltejs/adapter-node` on port 8080.

## Page routes

| Route | File(s) | Render | Purpose |
| --- | --- | --- | --- |
| `/` | `+page.svelte`, `+page.server.ts` | SSR redirect → `/dinah-saurr`, **except** when `?code=...` (OAuth redirect) — then renders a branded loading screen and exchanges the code via `authService.loginWithGlance` | OAuth redirect landing for in-app WebViews |
| `/[slug]` | `+page.svelte`, `+layout.svelte`, `+layout.server.ts` | SSR loads influencer payload, CSR renders sections | Influencer profile (hero, latest, ask, look-collection, wardrobe, look-grid) |
| `/[slug]/chat` | `chat/+page.svelte` | CSR — Firestore-backed chat | AI stylist conversation. See @docs/chat-architecture.md |
| `/auth/callback` | `auth/callback/+page.svelte` | CSR | OAuth popup-mode landing — `postMessage`s the code to `window.opener` then closes |

Plus error boundaries: `+error.svelte` (root, generic) and `[slug]/+error.svelte` (slug-aware 404 message). Both render `$lib/components/common/ErrorPage.svelte` with `page.error.sentryId` for support tickets.

## Layout hierarchy

```
+layout.svelte                      ← root
  ├ ToastContainer (always)
  ├ LoginPopup (lazy, when loginStore.isPopupVisible)
  ├ UserOnboarding (lazy, when onboardingStore.isActive)
  └ slot
      └ [slug]/+layout.svelte       ← slug-scoped
          ├ chatStore.prefetch on auth-ready
          ├ chatStore.fullReset on slug change / unmount
          └ slot
              ├ +page.svelte        (influencer profile)
              └ chat/+page.svelte   (chat)
```

Root layout responsibilities (`src/routes/+layout.svelte`):
- Calls `authService.initialize()` and `loadSentinel({ pageName: 'APP_INIT', ... })` once on mount.
- `onNavigate` interceptor runs `document.startViewTransition` and sets `data-transition="forward|back"` on `<html>` based on path-depth comparison — drives the `view-transition-old/new` keyframes in `app.css`.
- Preconnects to `PUBLIC_IMAGE_CDN` and `CDN_RESIZER_BASE` origins via `<link rel="preconnect">`.

`[slug]/+layout.server.ts` reads `ai_influencer_profile_id` / `ai_influencer_account_id` cookies (set by `authService.completeLogin` via `setProfileCookies`, 30 d, SameSite=Lax) and forwards them to `getInfluencerBySlug(slug, undefined, { profileId, accountId })` so SSR delivers personalized payloads. Uses **global** `fetch`, not SvelteKit's `event.fetch`, to avoid the `Origin` header that the backend rejects via CORS.

`[slug]/+layout.svelte` is responsible for chat lifecycle — it fires `chatStore.prefetch(influencer.id)` once `userStore.authInitialized === true` and resets on slug change or unmount.

## API endpoints (server)

All under `src/routes/api/`. Each endpoint that mutates or proxies enforces a `Bearer` token and reports failures to Sentry with an operation tag.

| Method + path | File | Auth | Purpose |
| --- | --- | --- | --- |
| `GET /api/health` | `health/+server.ts` | None | k8s liveness — returns `{ status: 'ok' }`. Wired up at `deployment_values/values{,_uat}.yaml:73`. |
| `POST /api/upload` | `upload/+server.ts` | Bearer required | **Mock today** — returns a fake `https://storage.glance-cdn.com/uploads/...` URL. Real selfie uploads bypass this and go straight to Bifrost from the client. |
| `GET /api/download?url=&filename=` | `download/+server.ts` | Bearer required | CORS-safe image download proxy. Restricted to `*.glance-cdn.com`, https only, 15 s timeout, sanitized filename, `Content-Disposition: attachment`, no-store. The CDN URL itself carries `Expires`+`Signature` query params — per-image authorization is upstream. |
| `POST /api/auth/google` | `api/auth/google/+server.ts` | Body: `{ code, redirect_uri }` | Server-side Google OAuth code exchange. Reads `process.env.GOOGLE_CLIENT_SECRET`. Currently **superseded** by client-side flow in `services/auth.ts:loginWithGlance` — kept for fallback/historical reasons. |
| `GET / PATCH /api/user/profile` | `api/user/profile/+server.ts` | Bearer required | Glance Account profile read + age PATCH proxy. Forwards `X-Client-Id: GOOGLE_CLIENT_ID`. **Currently unused by the client** — `services/auth.ts:getAccountInfo` and `updateAccountAge` call Glance Account directly. Left in place as a fallback. |

## Hooks layer

- `hooks.server.ts` — `Sentry.sentryHandle()` first in the sequence, then a custom handler that adds `Cache-Control: public, max-age=31536000, immutable` for `/_app/immutable/*` and `X-Content-Type-Options: nosniff` everywhere. `handleErrorWithSentry()` captures uncaught load errors.
- `hooks.client.ts` — `Sentry.init` with `replayIntegration` (non-prod only) plus `handleErrorWithSentry()` export.
- `instrumentation.server.ts` — Sentry's required pre-bootstrap init for server tracing. Loaded before the adapter starts. **Must not** be collapsed into `hooks.server.ts` — Sentry needs the early bootstrap to instrument `fetch`/HTTP. See @docs/error-tracking.md.

## OAuth redirect convention

When Google redirects back to `/?code=...`, `+page.server.ts` returns `{ authCode: code }` instead of issuing the default 302. The client `+page.svelte:onMount` reads `$page.data.authCode` and calls `authService.loginWithGlance(authCode, window.location.origin)`. On success it reads `getLoginIntent()` and `goto(returnUrl, { replaceState: true })`. 30 s timeout fallback navigates back regardless.

`auth/callback/+page.svelte` handles the **popup** variant: it `window.opener.postMessage({ type: 'google-auth-success', code }, ...)` and the main window's GSI handler runs the exchange. See @docs/auth-flows.md for the popup vs. redirect decision tree.

## Path aliases

`$lib` → `src/lib`, `$components` → `src/lib/components`, `$data` → `src/lib/data`. Always use aliases — never deep-relative imports. The only barrels are `src/lib/api/index.ts` and `src/lib/types/index.ts`.
