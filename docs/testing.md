# Testing

Vitest 4 is wired up but the suite is essentially empty. One sample test exists. There is no E2E (Playwright/Cypress) setup.

## Current state

```
tests/
  setup.ts              imports '@testing-library/jest-dom/vitest'  ⚠ dep missing
  unit/
    index.test.ts       trivial sanity check (1 + 2 === 3)
```

`npm run test:unit` runs `vitest run` (one-shot, no watch). `npm run test` is an alias.

## The missing dependency gotcha

`tests/setup.ts` imports `@testing-library/jest-dom/vitest`, but `@testing-library/jest-dom` **is not in `package.json`**. Currently nothing imports `tests/setup.ts` so the missing dep doesn't bite — `vitest.config.ts` doesn't exist either, so the setup file is never loaded.

Before writing any DOM-assertion test:

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/svelte
```

Then create `vitest.config.ts` (or extend `vite.config.ts`) with `setupFiles: ['./tests/setup.ts']`. Without that, the setup file is dead code.

## Adding a test

Pick a colocated or `tests/unit/` location. Existing convention is `tests/unit/<feature>.test.ts`.

```ts
import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl } from '$lib/utils/imageOptimization';

describe('getOptimizedImageUrl', () => {
  it('returns empty string for undefined input', () => {
    expect(getOptimizedImageUrl(undefined, 100, 100)).toBe('');
  });
});
```

Path aliases (`$lib`, `$components`, `$data`) work because `vitest` reads `vite.config.ts` and SvelteKit's plugin resolves them. No extra config needed for non-DOM tests.

## DOM / component tests

Once the deps are installed:

```ts
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import MyComponent from '$lib/components/.../MyComponent.svelte';

describe('MyComponent', () => {
  it('renders', () => {
    render(MyComponent, { props: { foo: 'bar' } });
    expect(screen.getByText('bar')).toBeInTheDocument();
  });
});
```

Svelte 5 + runes + Vitest + `@testing-library/svelte` is supported as of `@testing-library/svelte` 5+.

## Mocking strategy

- **`api.client`**: stub the `fetch` global with `vi.stubGlobal('fetch', vi.fn(...))`. Don't mock `api.client` directly — it's a thin wrapper; mocking `fetch` exercises the refresh + retry logic.
- **`userStore` / runes stores**: mutate the exported `$state` object directly in `beforeEach`. They're plain reactive objects.
- **Firebase**: mock `getFirestoreInstance()` / `getAuthInstance()` to return `null`, and the rest of the chat code falls through to the disabled-Firebase path. See @docs/firebase.md.
- **Sentinel**: don't init it in tests — `loadSentinel` is browser-only and inserts a `<script>` tag. If a code path calls `trackEvent`, stub `window.Sentinel` with a no-op `trackEvent`.
- **`localStorage`**: jsdom (Vitest's default DOM env) provides a working localStorage. Reset between tests with `localStorage.clear()`.

## What to test (priorities)

The high-value targets, in order:

1. `src/lib/api/client.ts` — refresh dedup, 401 retry, timeout. Pure function with `fetch` mocking.
2. `src/lib/utils/tryOnUtil.ts` — `isGenderMismatch`, `formatTime`, body-type maps. Pure utilities.
3. `src/lib/services/loginIntent.ts` — sessionStorage shape, TTL, `setRestoredAction` relay. Already isolated.
4. `src/lib/api/user.ts` — `mapBodyTypeToAPI` / `mapEthnicityToAPI`. Pure mapping.
5. `src/lib/firebase/auth.ts:waitForAuthReady` — promise dedup + timeout. Async with timers.

Anything that depends on `chatStore` (1433 lines) is hard to unit-test — start with the parsers in `src/lib/firebase/chat.ts:firestoreDocToMessage` (pure, branchy) before tackling the store itself.

## Running

```bash
npm run test:unit       # vitest run (one-shot)
npx vitest              # watch mode (no script alias yet)
npx vitest --coverage   # uses @vitest/coverage-v8 — install if needed
```

## CI

The `npm run test` step is **not currently invoked** by any `.github/workflows/*` file in this repo. CI runs only `npm run check` and `npm run lint` (via `inmobi-se/central-workflows/workflow-quality.yml`). When the test suite is non-trivial, add a step that runs `npm run test:unit` to the central workflow override. See @docs/deployment.md.

## E2E

There's no Playwright / Cypress / Puppeteer setup. If you add one, put fixtures under `tests/e2e/` and add a `test:e2e` npm script — don't reuse `test:unit`. Browser-based tests need a separate config (the Vitest jsdom env doesn't run real browsers).
