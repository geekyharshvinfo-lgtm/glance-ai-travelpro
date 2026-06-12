# Components

Feature-grouped under `src/lib/components/`. 10 folders, ~110 components total. Mobile-only (`max-width: 475px`).

## Folder layout

| Folder | Files | Role |
| --- | --- | --- |
| `chat/` | 19 | Chat surface — header, history drawer, input, starter tiles, message blocks (text/image/products/VTON/CTA/pills/tiles/add-images), warning, typing indicator, similar-product card |
| `collection/` | 5 | Drawer + look-grid + product list views (the bottom-sheet that opens from product cards) |
| `bottomsheets/` | 5 | Reusable `BottomSheet.svelte` + cookie consent + delete-account + become-influencer |
| `common/` | 7 | Cross-cutting: `Toast`, `ToastContainer`, `ErrorPage`, `GeneratingOverlay`, etc. |
| `icons/` | 53 | All SVG icons. Re-exported via `icons/index.ts`. Each is a `<svg>` snippet, not a wrapped component |
| `influencer/` | 8 | Profile-page sections — `HeroSection`, `LatestSection`, `AskSection`, `LookCollection`, `WardrobeSection`, `Footer`, `Header`, `QuickActionsBar` |
| `loaders/` | 2 | Shimmer placeholders for chat / influencer pages |
| `login/` | 2 | `LoginPopup` (lazy-loaded by root layout) + age-consent popup helpers |
| `onboarding/` | 2 | `UserOnboarding` flow (lazy) + `Camera` selfie-capture widget |
| `profile/` | 9 | Profile dropdown, settings, my-looks, edit-profile flows |

## Lazy loading at the root

Modal-style features that the user doesn't always see are gated and dynamic-imported in `+layout.svelte`:

```svelte
{#if loginStore.isPopupVisible || loginStore.isAgeConsentPopupVisible}
  {#await import('$lib/components/login/LoginPopup.svelte')}
    <div class="modal-overlay"></div>
  {:then { default: LoginPopup }}
    <LoginPopup />
  {/await}
{/if}

{#if onboardingStore.isActive}
  {#await import('$lib/components/onboarding/UserOnboarding.svelte')}
    <div class="modal-overlay"></div>
  {:then { default: UserOnboarding }}
    <UserOnboarding />
  {/await}
{/if}
```

Both components pull large dep trees (camera widget, file APIs) — keeping them out of the initial bundle is the point. The fallback overlay shows a black scrim while the chunk loads.

## Section-driven rendering (`[slug]/+page.svelte`)

The influencer page maps backend `section.type` to components:

```
hero          → HeroSection + (if products) QuickActionsBar
editorial     → LatestSection
ai_actions    → AskSection
look_collection → LookCollectionSection
product_grid  → WardrobeSection
look_grid     → LookGridSection
```

Each section is wrapped in `<div data-section-name="<title|type>">` so `usePageTracking` can attribute horizontal swipes to a section in analytics. See @docs/analytics.md.

## Mobile-only design system (`src/app.css`)

- **Container**: `.container { max-width: 475px; margin: 0 auto; min-height: 100dvh }`. Don't add desktop layouts.
- **Type scale**: `html { font-size: clamp(14px, 3.884vw, 18px) }`. The `3.884vw` formula is `16px / 412px * 100` — `1rem` equals 16 px at 412 px viewport (typical mobile reference width). Use `rem` units throughout; `clamp()` prevents tablet/desktop accidents.
- **Theme**: dark, `#111111` background, white text, Montserrat primary font (preloaded with stylesheet `onload` swap in `app.html`).
- **Buttons**: utility classes `.btn`, `.btn-gradient` (purple-magenta gradient), `.btn-dark`. Don't restyle these per-page.
- **Shimmer**: `.shimmer` global keyframe for skeleton states. 1.5 s ease-in-out, animated `background-position`.
- **Tap highlight**: `-webkit-tap-highlight-color: transparent` on all elements globally.

## View transitions

Root `+layout.svelte` registers an `onNavigate` handler that:

1. Compares URL depth (`pathname.split('/').length`) before/after.
2. Sets `document.documentElement.dataset.transition = 'forward' | 'back'`.
3. Wraps `navigation.complete` inside `document.startViewTransition`.

`app.css:70-110` defines two pairs of keyframes (`slide-in-from-{right,left}` and `slide-out-{left,right}`) keyed off the `[data-transition='...']` attribute. 250 ms `cubic-bezier(0.4, 0, 0.2, 1)`. Browsers without View Transitions API fall through cleanly (the navigation just happens).

## Component conventions

- **Default to client.** Server-only logic goes in `+page.server.ts` / `+layout.server.ts` / `+server.ts`.
- **Props via `$props()`**: `let { data, foo = defaultFoo }: Props = $props();`. Always type the props interface inline.
- **Reactive derivations**: `const x = $derived(something)`. Use `$derived.by(() => { ... })` only when the body is multi-line (e.g., `[slug]/chat/+page.svelte:53` chat view-state computation).
- **Side effects**: `$effect(() => { ... })` inside components, `$effect.root(() => { ... })` for module-level setup in `*.svelte.ts`. Cleanup with returned function or `onDestroy`.
- **`untrack`**: use `untrack(() => prevRef)` when reading state inside `$effect` that you don't want to re-trigger the effect (see `[slug]/+layout.svelte:30`).
- **Imports**: use path aliases (`$lib/...`, `$components/...`) — never deep relative paths. Components occasionally import from `$components/chat/...` instead of `$lib/components/chat/...`; both work.

## Icon usage

Icons live as standalone Svelte components in `src/lib/components/icons/`. Import them directly:

```svelte
import { CrossIcon, DownloadIcon, ShareIcon } from '$lib/components/icons';
```

The barrel `icons/index.ts` is allowed. So are `bottomsheets/index.ts` (re-exports `BottomSheet`, `BecomeInfluencerBottomSheet`, `CookieConsentBottomSheet`) and `loaders/index.ts` (re-exports `StarLoader`). These are the only component-folder barrels — don't add new ones. Each icon takes `width`/`height`/`color` props. Don't inline raw `<svg>` blocks in feature components — extract to `icons/`.

## Image rendering

Always run image URLs through `getOptimizedImageUrl(url, width, height)` from `$lib/utils/imageOptimization`:

```ts
import { getOptimizedImageUrl, getHeroPreloadUrl } from '$lib/utils/imageOptimization';
```

The helper:
1. Returns the original URL unchanged if it's already pointing at `CDN_RESIZER_BASE`.
2. Multiplies dimensions by 2.5 (retina) and rounds.
3. Returns `${CDN_RESIZER_BASE}?img_url=<encoded>&w=<w>&h=<h>`.

For above-the-fold heroes, also preload via `<link rel="preload" as="image" href={getHeroPreloadUrl(originalUrl)}>` in `<svelte:head>` — see `[slug]/+page.svelte:117`.

## Page-tracking composable

If you add a new page (rare — most features go inside `[slug]`), call `usePageTracking({ pageName, section?, metadata? })` from `onMount`. It wires up `PAGE_START` / `PAGE_END` / visibility change / swipe events. See @docs/analytics.md and `src/lib/composables/usePageTracking.svelte.ts`.
