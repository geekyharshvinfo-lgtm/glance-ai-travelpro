# CLAUDE.md

Project-specific guidance for Claude Code. Glance org standards (commits, branches, PR titles, JIRA validation) are in `~/CLAUDE.md` — follow those too. Personal/machine-specific overrides go in `CLAUDE.local.md` (gitignored).

## Project
Mobile-first SvelteKit web app for AI influencer fashion shopping. Users browse looks, run virtual try-on (selfie + outfit), and chat with the AI stylist over Firebase. Production: `influencers.glance.com`. JIRA project: AIP. Active development.

## Stack
- SvelteKit 2.55 + **Svelte 5 with runes** (`runes: true` in `svelte.config.js`)
- TypeScript 5.9 strict, `moduleResolution: bundler`
- Vite 7, Vitest 4 (only one sample test in `tests/unit/`)
- ESLint 9 flat config + Prettier (single quotes, 2-space, 100-col, no tabs)
- Node `>=25.0.0`, npm `>=11.0.0` (CI runs Node 18 — mismatch is intentional, see workflow)
- Firebase 12 (Firestore + custom-token auth), Sentry SvelteKit 10
- Adapter: `@sveltejs/adapter-node` → `./build`, container on port 8080
- Package manager: **npm** (`package-lock.json` only)

## Structure
For the full layer map and request flow, see @docs/architecture.md.
- `src/routes/` — pages + `api/{health,upload,download,auth/google,user/profile}`. See @docs/routing.md
- `src/lib/api/` — typed REST client + per-resource modules. See @docs/api-layer.md
- `src/lib/firebase/` — lazy-init Firestore + custom-token auth. See @docs/firebase.md
- `src/lib/services/` — `auth.ts`, `loginIntent.ts`, `storageSync.ts`. See @docs/auth-flows.md
- `src/lib/stores/` — 15 runes stores in `*.svelte.ts`. See @docs/state-management.md
- `src/lib/composables/` — `useTryOn.svelte.ts`, `usePageTracking.svelte.ts` (use `.svelte.ts` for runes outside components)
- `src/lib/components/` — feature-grouped (chat/collection/influencer/…). See @docs/components.md
- `src/lib/config/env.ts` — typed env access; reads from generated `runtime-env.ts`. See @docs/environment.md
- `src/hooks.{client,server}.ts` + `src/instrumentation.server.ts` — Sentry init in 3 places. See @docs/error-tracking.md

Path aliases: `$lib` → `src/lib`, `$components` → `src/lib/components`, `$data` → `src/lib/data`.

## Dev commands
```bash
npm install
npm run dev          # generates dev runtime-env.ts then starts vite on :3000
npm run build        # builds against current .env (whatever is there)
npm run build:dev    # regenerates runtime-env from .env then builds
npm run build:uat    # regenerates from .uat.env then builds
npm run build:prod   # regenerates from .prod.env then builds
npm run preview      # serve last build
npm start            # run built node server (build/index.js)
npm run check        # svelte-kit sync + svelte-check (typecheck)
npm run lint         # prettier --check + eslint
npm run lint:fix     # prettier --write + eslint --fix
npm run format       # prettier --write
npm run test:unit    # vitest run
```

## Verify changes
In order, fastest first:
1. `npm run check` — svelte-check + tsc
2. `npm run lint` — fails on formatting drift
3. `npm run test:unit`
4. `npm run build` — full production build (slow; needed for non-trivial Vite/SvelteKit changes)

## Conventions
- **Svelte 5 runes only.** Use `$state`, `$derived`, `$effect`, `$props`. No legacy `$:` reactive blocks or `writable()` stores. Stateful modules outside components must be `*.svelte.ts`.
- Components default to client-side. Server-only logic goes in `+page.server.ts` / `+layout.server.ts` / `+server.ts`.
- Imports: always use path aliases (`$lib/...`), never deep relative paths. Existing barrels: `api/`, `types/`, `firebase/` (also the init module), `data/mocks/`, `components/{icons,bottomsheets,loaders}/`. Don't add new ones.
- Env access: import named exports from `$lib/config/env` (e.g. `API_ENDPOINTS`, `SENTRY_DSN`, `FIREBASE_CONFIG`). Never read `import.meta.env` or `process.env` directly in app code.
- API calls: use `api.get/post/...` from `$lib/api/client.ts`. It handles auth, 401 retry, 45s timeout. Throw/propagate `ApiError` from API modules.
- Errors: report to Sentry with `Sentry.captureException(err, { tags: { operation: '<slug>' } })`. Console `log/info/debug/warn` are stripped in production by terser (`pure_funcs`); use `console.error` for messages that must survive.
- Mobile-only design: container is `max-width: 475px`, dark theme, `1rem` scales 14-18px via `clamp(14px, 3.884vw, 18px)` in `app.css`. Don't add desktop layouts.
- Image URLs go through `getOptimizedImageUrl()` from `$lib/utils/imageOptimization` (CDN resizer at `CDN_RESIZER_BASE`).
- Cross-tab state syncs via `localStorage` + `$effect.root` — see `userStore` in `user.svelte.ts` for the canonical pattern. Used by `tryOnStore` and `chatTryOnQueue`.
- Auth-gated actions (try-on, style-me) use the deferred-action pattern in `loginIntent.ts` — push intent, run login, replay on resume.

## Known gotchas
- `npm run dev` runs `scripts/generate-env.js` which writes `src/lib/config/runtime-env.ts` (gitignored). Calling `vite dev` directly skips this and breaks `$lib/config/env`.
- `tests/setup.ts` imports `@testing-library/jest-dom/vitest`, but **the package is not in `package.json`**. Install it before adding DOM-assertion tests.
- Env files (`.env`, `.non-prod.env`, `.uat.env`, `.prod.env`) are committed — only `PUBLIC_*` vars. `scripts/pre-build.sh` copies one over `.env` based on `BUILD_ENV_VAL`.
- `.env.sentry-build-plugin` holds the Sentry token and is currently committed (it shouldn't be — flag if you touch it).
- Sentry initializes in three places — `src/instrumentation.server.ts`, `src/hooks.client.ts`, and the `sentrySvelteKit()` Vite plugin. Server-side tracing relies on `kit.experimental.{tracing,instrumentation}.server = true` (already set).
- Firebase is optional: `FIREBASE_ENABLED` is `false` if any of api-key/auth-domain/project-id/app-id are missing. All Firebase callers must handle `getFirestoreInstance()` / `getAuthInstance()` returning `null`.
- `vite.config.ts` `manualChunks` returns `undefined` for `firebase` and `esm-env` to suppress empty chunks — don't re-add them.
- Mock data: `USE_MOCK_INFLUENCER_DATA` flag in `src/lib/data/mocks/influencer.ts` bypasses the backend during dev.
- Default branch is `master`. Branching workflow is `github_flow` (`buildParams/projectInfo.json`) — releases merge directly to `master` via release-type PRs.

## Reference docs (load on demand)
Big picture & layout:
- `@docs/architecture.md` — system layer map, init sequence, request paths, source-map of every layer
- `@docs/routing.md` — page routes + API endpoints + layout hierarchy + OAuth redirect convention
- `@docs/components.md` — folder layout, lazy-loaded modals, view transitions, mobile design system, image opt

Domain features:
- `@docs/auth-flows.md` — guest + Google + Firebase custom token; `loginIntent` deferred-action; token-refresh dedup
- `@docs/chat-architecture.md` — chatStore lifecycle, dual Firestore format, 4 view states, ban + cache
- `@docs/tryon-pipeline.md` — `useTryOn` composable, polling/timer, gender-mismatch + onboarding gates, cross-tab queue
- `@docs/analytics.md` — Sentinel integration, event keys, declarative click tracking, do-not-double-fire

Cross-cutting layers:
- `@docs/api-layer.md` — `api.client` (refresh dedup, 401 retry, 45 s timeout) + all resource modules + headers convention
- `@docs/state-management.md` — every store, persistence patterns, all storage keys, what NOT to do
- `@docs/firebase.md` — lazy-init, `FIREBASE_ENABLED` kill-switch, `waitForAuthReady` IndexedDB race
- `@docs/error-tracking.md` — Sentry's 3 init points, sample rates, source maps, capture conventions

Build & ops:
- `@docs/environment.md` — `.env` files, `generate-env.js`, Vite settings, every PUBLIC_* var
- `@docs/testing.md` — Vitest setup, missing `@testing-library/jest-dom` dep, what to test first
- `@docs/deployment.md` — Dockerfile, Helm UAT/prod, CI workflows, branching, rolling back.
