# AI Influencer Web

Mobile-first SvelteKit web app for AI influencer fashion shopping. Users browse a curated catalog of looks, run virtual try-on by uploading a selfie, and chat with the AI stylist for outfit recommendations. Production lives at `influencers.glance.com`.

Status: active development. Internal Glance project (JIRA: AIP).

## Tech stack

- SvelteKit 2 + Svelte 5 (runes mode)
- TypeScript, Vite, Vitest
- Firebase (Firestore + custom-token auth) for real-time chat
- Sentry for error tracking
- Sentinel for product analytics
- `@sveltejs/adapter-node` for production (Docker, port 8080)

## Prerequisites

- Node `>=25.0.0` (`nvm use` reads `.nvmrc` → v25.8.0)
- npm `>=11.0.0`
- Docker (only if building/running the container locally)

The Inmobi private npm registry (`inmobiartifactory.jfrog.io`) is required for the Docker build but not for local `npm install` against `package-lock.json`.

## Getting started

```bash
git clone <repo>
cd ai-influencer-web
npm install
npm run dev
```

Dev server runs on http://localhost:3000 and watches `src/`. `npm run dev` first runs `scripts/generate-env.js`, which materializes `src/lib/config/runtime-env.ts` from the active `.env`.

To target a non-default environment locally:

```bash
npm run build:uat       # uses .uat.env
npm run build:prod      # uses .prod.env
npm run preview:uat     # builds + previews UAT
```

## Project structure

```
src/
  app.html                   page shell, font preloads
  app.css                    global styles + view-transition keyframes
  hooks.client.ts            Sentry init + client error handler
  hooks.server.ts            Sentry handle + cache headers + nosniff
  instrumentation.server.ts  Sentry server init (loaded by adapter)
  routes/
    +layout.svelte           container, view transitions, lazy modals
    +page.svelte             OAuth redirect landing page
    [slug]/                  influencer profile pages
    [slug]/chat/             AI stylist chat
    auth/callback/           OAuth code exchange
    api/                     health, upload, signed-CDN download proxy,
                             Google auth, user profile
  lib/
    api/                     typed REST client + per-resource modules
    components/              feature-grouped (chat, influencer, profile, …)
    composables/             reusable runes logic (useTryOn, usePageTracking)
    config/                  env access + Firebase config
    constants/               analytics keys, storage keys, urls, body types
    firebase/                lazy-init Firestore + custom-token auth
    services/                auth, loginIntent, storageSync
    stores/                  *.svelte.ts state stores
    types/                   shared TypeScript types
    utils/                   analytics, googleAuth, image opt., try-on
scripts/                     generate-env.js, pre-build.sh
tests/                       vitest setup + sample unit test
deployment_values/           Helm values (UAT / prod)
buildParams/                 project metadata + branch protection rules
```

## Key scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Generate dev env, start Vite on :3000 |
| `npm run build` | Production build (default env) |
| `npm run build:uat` / `build:prod` / `build:dev` | Build for a specific env |
| `npm run preview` | Serve the production build locally |
| `npm start` | Run the built Node server (`node build`) |
| `npm run check` | `svelte-kit sync` + `svelte-check` (typecheck) |
| `npm run lint` / `lint:fix` | Prettier + ESLint |
| `npm run format` | Prettier write |
| `npm run test:unit` | Vitest |

## Environment variables

Env files are committed (only `PUBLIC_*` vars):

- `.env` — local development (`PUBLIC_ENV=development`)
- `.non-prod.env` — non-prod CI/CD
- `.uat.env` — UAT
- `.prod.env` — production

`scripts/pre-build.sh` swaps the active `.env` based on `BUILD_ENV_VAL` (`production` / `non-production` / `uat`). `scripts/generate-env.js` reads the active file and writes `src/lib/config/runtime-env.ts` (gitignored). All app code reads through `src/lib/config/env.ts`.

| Var | Purpose |
| --- | --- |
| `PUBLIC_ENV` | Build environment label |
| `PUBLIC_FIREBASE_*` | Firebase project config (api key, auth domain, project id, app id, storage bucket, messaging sender, measurement id) |
| `PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `PUBLIC_AUTH_CLIENT_ID` | Glance auth client ID |
| `PUBLIC_GLANCE_ACCOUNT_API_URL` | Glance accounts service base URL |
| `PUBLIC_BIFROST_API_URL` | Bifrost API base URL |
| `PUBLIC_AI_INFLUENCER_BACKEND_URL` | App backend base URL (`/api/v1`) |
| `PUBLIC_IMAGE_CDN` | Image CDN host |
| `PUBLIC_CDN_RESIZER_BASE` | Image resizer endpoint |
| `PUBLIC_STAGING_CDN` | Staging CDN host |
| `PUBLIC_SENTINEL_ENDPOINT` / `PUBLIC_SENTINEL_API_KEY` | Sentinel analytics |
| `PUBLIC_SENTRY_DSN` / `PUBLIC_SENTRY_ENVIRONMENT` | Sentry runtime |
| `PUBLIC_CHAT_SESSION_RESTORE_TIME` | Chat restore window in seconds (default 86400) |
| `SENTRY_AUTH_TOKEN` | Build-time only, used to upload source maps (`.env.sentry-build-plugin`) |

## Deployment

Containerized via the included `Dockerfile` (`node:25.8.0-alpine3.23`, runs `node build` on port 8080) and deployed to GCP via Helm:

- UAT — `deployment_values/values_uat.yaml`
- Production — `deployment_values/values.yaml`, hostname `influencers.glance.com`, image registry `us-central1-docker.pkg.dev/platformtools-prod-872a/docker-prod-gar/inmobi-glance/ai-influencer-web`
- Health check: `GET /api/health`

CI runs through `inmobi-se/central-workflows`:

- `.github/workflows/ci-pr-workflow.yml` — quality + build on PRs to `master` / `develop`
- `.github/workflows/ci-release-workflow.yml` — artifacts + release ops on push to `master`
- `.github/workflows/ci-hygiene.yml` — PR title / branch / commit validation

PRs to `master` require 1 approval (`buildParams/git.json`). Default branch is `master`.

## Documentation

Deep dives live under `docs/`. Start with `architecture.md`, then drill into the layer you're touching.

**Big picture**

| Doc | What's in it |
| --- | --- |
| [`architecture.md`](docs/architecture.md) | System layer map, init sequence, request paths, source-map of every layer |
| [`routing.md`](docs/routing.md) | Page routes, API endpoints, layout hierarchy, OAuth redirect convention |
| [`components.md`](docs/components.md) | Component folders, lazy modals, view transitions, mobile design system, image opt |

**Domain features**

| Doc | What's in it |
| --- | --- |
| [`auth-flows.md`](docs/auth-flows.md) | Guest + Google OAuth + Firebase custom token, deferred-action login, refresh dedup |
| [`chat-architecture.md`](docs/chat-architecture.md) | chatStore lifecycle, dual Firestore format, view states, ban + cache |
| [`tryon-pipeline.md`](docs/tryon-pipeline.md) | `useTryOn` composable, polling/timer, gender-mismatch + onboarding gates, cross-tab queue |
| [`analytics.md`](docs/analytics.md) | Sentinel integration, event taxonomy, declarative click tracking, do-not-double-fire |

**Cross-cutting layers**

| Doc | What's in it |
| --- | --- |
| [`api-layer.md`](docs/api-layer.md) | `api.client` (refresh dedup, 401 retry, 45 s timeout) + all resource modules + headers |
| [`state-management.md`](docs/state-management.md) | Every store, persistence patterns, all storage keys, what NOT to do |
| [`firebase.md`](docs/firebase.md) | Lazy init, `FIREBASE_ENABLED` kill-switch, `waitForAuthReady` IndexedDB race, schema |
| [`error-tracking.md`](docs/error-tracking.md) | Sentry's 3 init points, sample rates, source maps, capture conventions |

**Build & ops**

| Doc | What's in it |
| --- | --- |
| [`environment.md`](docs/environment.md) | `.env` files, `generate-env.js`, Vite/Svelte settings, every `PUBLIC_*` var |
| [`testing.md`](docs/testing.md) | Vitest setup, missing `@testing-library/jest-dom` dep, what to test first |
| [`deployment.md`](docs/deployment.md) | Dockerfile, Helm UAT/prod, CI workflows, branching, rolling back |

`CLAUDE.md` is the short-form summary intended for AI agents — it indexes the docs above and inlines only the rules that need to be top-of-mind during a session.

## Contributing

Glance org conventions apply (CI-enforced):

- **Branch:** alphanumeric, no slashes, include the JIRA ID — e.g. `feature-AIP-1234-add-foo`
- **Commits:** `<type>(<scope>): description`, lowercase imperative — `feat` / `fix` / `hotfix` / `docs` / `style` / `refactor` / `test`. No JIRA IDs in commits.
- **PR title:** `<type>(<scope>): [AIP-1234] summary`. Releases to `master` use `release` / `major-release` / `minor-release` / `patch-release`.

Before pushing:

```bash
npm run check
npm run lint
npm run test:unit
```

See `CLAUDE.md` for development conventions and known gotchas.
