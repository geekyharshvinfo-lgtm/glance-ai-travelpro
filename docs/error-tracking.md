# Error tracking (Sentry)

`@sentry/sveltekit` 10 with three init points: server bootstrap, client bootstrap, and Vite plugin (source-map upload). Different sample rates per environment. Replay only outside production.

## Files

| File | Role |
| --- | --- |
| `src/instrumentation.server.ts` | Pre-bootstrap server init — instruments `fetch`/HTTP before SvelteKit starts |
| `src/hooks.server.ts` | `Sentry.sentryHandle()` first in `sequence()`, then header middleware. Exports `handleErrorWithSentry()` |
| `src/hooks.client.ts` | Browser init + Replay (non-prod) + `handleErrorWithSentry()` |
| `vite.config.ts` | `sentrySvelteKit()` plugin — uploads source maps when `SENTRY_AUTH_TOKEN` is set and `PUBLIC_ENV` is `production` or `uat` |
| `src/app.d.ts:7` | Augments `App.Error` with `sentryId?: string` so error pages can show it |

## Why three init points

This is not a bug. SvelteKit + Sentry require all three:

1. **`instrumentation.server.ts`** — loaded by adapter-node before `hooks.server.ts`. Required by `@sentry/sveltekit` for server-side tracing (`kit.experimental.tracing.server` and `instrumentation.server` are both `true` in `svelte.config.js`). Removing this leaves server fetches uninstrumented.
2. **`hooks.client.ts`** — runs once on hydration in the browser. This is where Replay lives.
3. **`sentrySvelteKit()` Vite plugin** — build-time only, uploads source maps so stack traces de-minify on the dashboard.

Don't collapse them.

## Init params

```ts
// hooks.client.ts
const isProduction = SENTRY_ENVIRONMENT === 'production';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  enableLogs: true,

  // Replay adds ~50KB — only load in non-production environments
  replaysSessionSampleRate: isProduction ? 0 : 0.1,
  replaysOnErrorSampleRate: isProduction ? 0 : 1.0,

  integrations: isProduction ? [] : [
    replayIntegration({ maskAllText: true, blockAllMedia: true }),
  ],

  sendDefaultPii: false,
});
```

`instrumentation.server.ts` is the same minus Replay. Both are no-ops if `SENTRY_DSN` is empty — handy for local dev.

## Source maps

`vite.config.ts:11`:

```ts
sentrySvelteKit({
  autoUploadSourceMaps: !!(process.env.SENTRY_AUTH_TOKEN && isDeployEnv),
  sourceMapsUploadOptions: {
    org: 'glance-app',
    project: 'ai-influencer',
    authToken: env.SENTRY_AUTH_TOKEN,
    release: { name: 'ai-influencer@' + process.env.npm_package_version },
  },
}),
```

`isDeployEnv = env.PUBLIC_ENV === 'production' || env.PUBLIC_ENV === 'uat'`. The token lives in `.env.sentry-build-plugin` (currently committed — flag if you touch it). The release name is `ai-influencer@<package.json version>`.

## Capturing errors

Always tag captures with a stable `operation` slug. The slug is what the dashboard groups by — it should describe the **what**, not the file. Pick from the existing slugs (`tryon_initiate`, `firebase_init`, `oauth_redirect_exchange`, `api_token_refresh`, `download_proxy_fetch`, `server_upload`, `selfie_upload`, `firestore_init`, …) or extend the convention.

```ts
import * as Sentry from '@sentry/sveltekit';

try {
  await doThing();
} catch (err) {
  Sentry.captureException(err, { tags: { operation: 'thing_do' } });
  throw err;
}
```

For non-Error values (timeouts, expected unhappy paths), use `Sentry.captureMessage(msg, { level, tags })` — see `routes/api/auth/google/+server.ts:44`.

## User identity

`services/auth.ts:completeLogin` calls `Sentry.setUser({ id: profileId, email, username })` and `Sentry.getCurrentScope().setTag('auth_type', 'google')`. Logout doesn't clear the user — Sentry retains the last identity for crashes that happen mid-logout. Don't add a `setUser(null)` unless you have a reason.

`[slug]/+layout.server.ts:38` also sets `slug` as a tag on the current scope when influencer load fails.

## Error pages

Both `+error.svelte` files render `$lib/components/common/ErrorPage.svelte` and pass `page.error?.sentryId`. The `sentryId` field comes from `App.Error` (declared in `src/app.d.ts`). Sentry's `handleErrorWithSentry()` populates it for users to quote in support tickets.

## Console functions in production

`vite.config.ts` strips `console.log`, `console.info`, `console.debug`, `console.warn` via terser `pure_funcs`. **`console.error` survives.** If you want a message that survives prod minification (e.g., a hard failure that doesn't merit a Sentry capture), use `console.error`. Otherwise prefer `Sentry.captureException`/`captureMessage`.

## Trace sampling

- Production: 10% of traces (`tracesSampleRate: 0.1`).
- Non-prod: 100%.

If you add a high-frequency span, consider per-route sampling rather than dropping the global rate. The current 10% is calibrated for the existing traffic profile.

## Replay

- Production: disabled (`0` / `0`).
- Non-prod: 10% of sessions, 100% on errors.
- Both modes have `maskAllText: true` and `blockAllMedia: true` — recordings show layout but not content. PII safe.

## Debugging

- Local: open Sentry's `glance-app/ai-influencer` project; non-prod events tag with `environment=development` or `environment=uat`.
- Stack traces in dev are unminified anyway (sourcemaps inline).
- `enableLogs: true` is set — `Sentry.logger.info(...)` calls reach the dashboard. Don't sprinkle them in hot paths.
