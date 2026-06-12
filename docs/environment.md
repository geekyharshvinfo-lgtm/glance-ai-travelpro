# Environment & build pipeline

Three layers: committed `.env` files (only `PUBLIC_*` vars), a build-time generator that materializes `runtime-env.ts`, and a typed accessor (`$lib/config/env.ts`) that the app imports.

## The four env files (committed)

| File | Used by | Purpose |
| --- | --- | --- |
| `.env` | `npm run dev`, `npm run build`, `npm run build:dev` | Development / non-prod default |
| `.non-prod.env` | CI when `BUILD_ENV_VAL=non-production` | Non-prod CI builds |
| `.uat.env` | `npm run build:uat`, CI when `BUILD_ENV_VAL=uat` | UAT |
| `.prod.env` | `npm run build:prod`, CI when `BUILD_ENV_VAL=production` | Production |

Each file contains **only** `PUBLIC_*` vars (Firebase, Google OAuth, API URLs, CDN, Sentinel, Sentry DSN). The Firebase API keys here are restricted by Firebase Console (HTTP referrer + auth domain), so committing them is intentional.

`.env.sentry-build-plugin` holds `SENTRY_AUTH_TOKEN` for source-map upload. **It is currently committed but shouldn't be** — flag if you touch it.

## How the env reaches the app

```
.env / .uat.env / .prod.env
        │                        ┌─ scripts/pre-build.sh ─┐
        │  CI: BUILD_ENV_VAL ────►│  cp .uat.env → .env   │
        │                        └────────────────────────┘
        ▼
  scripts/generate-env.js  ──reads via dotenv──►  src/lib/config/runtime-env.ts  (gitignored)
        ▲                                                         │
        │                                                         ▼
  npm run dev / build / build:* call this                src/lib/config/env.ts
                                                            │
                                                            ▼
                                                        app code
```

### `scripts/pre-build.sh`

Run only in CI (the `prebuild` npm script). Maps `$BUILD_ENV_VAL`:
- `production` → `cp ./.prod.env ./.env`
- `non-production` → `cp ./.non-prod.env ./.env`
- `uat` → `cp ./.uat.env ./.env`

Other values (or missing) → `.env` is unchanged. Local dev relies on the committed `.env` already being correct.

### `scripts/generate-env.js`

Reads one of `.env` / `.uat.env` / `.prod.env` via `dotenv` (CLI arg picks: `development` / `uat` / `production`; default `development`), then writes `src/lib/config/runtime-env.ts` with all `PUBLIC_*` keys hard-coded as string literals. The file is gitignored. **Don't edit it by hand** — it's overwritten on every build.

`npm run dev` runs `generate-env development` first. `npm run build:uat` runs `generate-env uat`. `npm run build` (no qualifier) runs `generate-env` with no arg → falls back to `.env`.

### `$lib/config/env.ts`

Imports `runtime-env.ts` and re-exports typed groups:

- `FIREBASE_CONFIG` — `{ apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }`
- `GOOGLE_CLIENT_ID`, `AUTH_CLIENT_ID`
- `API_ENDPOINTS` — `{ GLANCE_ACCOUNT, BIFROST, AI_INFLUENCER_BACKEND, STAGING_CDN, IMAGE_CDN }`
- `CDN_RESIZER_BASE`
- `SENTINEL_CONFIG` — `{ ENDPOINT, API_KEY, APP_NAME }` (`APP_NAME` is fixed: `'ai_embed_pwa'`)
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`
- `FIREBASE_ENABLED` — derived: `Boolean(apiKey && authDomain && projectId && appId)`
- `TOTAL_TIME_FOR_TRYON = 180` — try-on UI timer ceiling (s)
- `CHAT_SESSION_RESTORE_TIME` — `parseFloat(PUBLIC_CHAT_SESSION_RESTORE_TIME ?? '86400')` — chat ban duration (s)

**Always import these named exports.** Never read `import.meta.env` or `process.env` from app code.

## Variable reference

| Var | Purpose | Notes |
| --- | --- | --- |
| `PUBLIC_ENV` | Build environment label (`development` / `uat` / `production`) | Read by `vite.config.ts` to decide whether to upload source maps |
| `PUBLIC_FIREBASE_API_KEY` etc. | Firebase project config | All four (api-key, auth-domain, project-id, app-id) required for `FIREBASE_ENABLED=true` |
| `PUBLIC_FIREBASE_MEASUREMENT_ID` | GA4 measurement ID | **Read into `runtime-env.ts` but not exposed by `FIREBASE_CONFIG` in `env.ts`** — declared and unused today |
| `PUBLIC_GOOGLE_CLIENT_ID` | OAuth client ID | Used by GSI in `utils/googleAuth.ts` |
| `PUBLIC_AUTH_CLIENT_ID` | Glance auth client ID (`X-Client-Id`) | Different from OAuth client ID |
| `PUBLIC_GLANCE_ACCOUNT_API_URL` | `/api/v0/login/google`, `/api/v0/user`, `/api/v0/glance/auth/token/refresh` | Used by `services/auth.ts` |
| `PUBLIC_BIFROST_API_URL` | `/api/upload/v1/upload-url` | Used by `api/upload.ts` |
| `PUBLIC_AI_INFLUENCER_BACKEND_URL` | App backend base, ends in `/api/v1` | Default endpoint for `api.client.ts` |
| `PUBLIC_IMAGE_CDN` | Image CDN host | `<link rel="preconnect">` in root layout |
| `PUBLIC_CDN_RESIZER_BASE` | Image resizer endpoint | Used by `getOptimizedImageUrl()`, `getHeroPreloadUrl()` |
| `PUBLIC_STAGING_CDN` | Staging CDN host | Body-type asset URLs in `constants/bodyTypes.ts` |
| `PUBLIC_SENTINEL_ENDPOINT` / `PUBLIC_SENTINEL_API_KEY` | Sentinel analytics | See @docs/analytics.md |
| `PUBLIC_SENTRY_DSN` / `PUBLIC_SENTRY_ENVIRONMENT` | Sentry runtime | See @docs/error-tracking.md |
| `PUBLIC_CHAT_SESSION_RESTORE_TIME` | Chat ban duration in seconds (default 86400 = 24 h) | Used in `chatStore` for warning ban |
| `SENTRY_AUTH_TOKEN` | Source-map upload (build-time only) | Lives in `.env.sentry-build-plugin`; only used when `PUBLIC_ENV` is `production` or `uat` |
| `GOOGLE_CLIENT_SECRET` | Server-only — used by `routes/api/auth/google/+server.ts` | Read from `process.env`. Needed only if you re-enable the server-side OAuth flow |

## Vite build settings (`vite.config.ts`)

- `target: 'esnext'` — assume modern browsers (ES2022+).
- `cssCodeSplit: true` — per-route CSS chunks.
- `minify: 'terser'` with `pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']` — these are stripped in production. `console.error` survives. Don't rely on `console.log` for production diagnostics.
- `manualChunks` returns `undefined` for `esm-env` and `firebase` (suppresses empty-chunk warnings). Other packages get one chunk per package.
- `treeshake: 'smallest'` — aggressive.
- Sentry source maps upload only when `SENTRY_AUTH_TOKEN` is set **and** `PUBLIC_ENV` is `production` or `uat`.

## SvelteKit config (`svelte.config.js`)

- `compilerOptions.runes: true` — Svelte 5 runes globally.
- `adapter-node` → `out: 'build'`, `precompress: true` (gzip + brotli ahead of time).
- `inlineStyleThreshold: 5000` — small CSS gets inlined.
- `experimental.tracing.server: true` and `experimental.instrumentation.server: true` — required by `@sentry/sveltekit` for server-side tracing. Already set.

## Path aliases (also in svelte.config.js)

`$lib` → `src/lib`, `$components` → `src/lib/components`, `$data` → `src/lib/data`. TypeScript uses `moduleResolution: bundler` and `allowJs: true` so config files type-check too.

## Adding a new env var

1. Add `PUBLIC_FOO=...` to all four `.env` files (default to empty string if missing per env).
2. Append it to the `configContent` template in `scripts/generate-env.js`.
3. Add the corresponding typed export to `$lib/config/env.ts`.
4. Update the table in this doc and the env section of README.md.
5. Run `npm run dev` to regenerate `runtime-env.ts`. Don't commit the regenerated file.

Server-only secrets (no `PUBLIC_` prefix) bypass the runtime-env pipeline — read them from `process.env` directly inside `+server.ts` files.
