<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { goto } from '$app/navigation';
  import type { WardrobeSection, LatestSection } from '$lib/types';
  import TravelProWardrobeSection from '$lib/components/travelpro/TravelProWardrobeSection.svelte';
  import TravelProEditorialSection from '$lib/components/travelpro/TravelProEditorialSection.svelte';
  import TravelProHero from '$lib/components/travelpro/TravelProHero.svelte';
  import Lightbox from '$lib/components/travelpro/Lightbox.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  const BACKEND = PUBLIC_BACKEND_URL || 'http://localhost:3006';

  // Set to false to revert to localStorage (shared across all tabs on same device)
  const USE_SESSION_STORAGE = true;
  const selfieStorage = USE_SESSION_STORAGE ? sessionStorage : localStorage;

  type TravelProProduct = {
    id: string;
    name: string;
    price: string;
    category: string;
    size: string;
    imageUrl: string;
    description: string;
    redirectUrl: string;
  };

  type TravelProCollection = {
    id: string;
    name: string;
    tagline: string;
    uiStyle?: 'editorial' | 'grid';
    products: TravelProProduct[];
  };

  // A WardrobeSection per collection
  type GeneratedCard = {
    productId: string;
    generatedUrl: string | null;
    status: 'pending' | 'generating' | 'done' | 'error';
  };

  let selfieDataUrl = $state<string | null>(null);
  let collections = $state<TravelProCollection[]>([]);
  let generatedCards = $state<Map<string, GeneratedCard>>(new Map());
  let heroGenerated = $state<string | null>(null);
  let heroStatus = $state<'pending' | 'generating' | 'done' | 'error'>('pending');
  let loadingCatalogue = $state(true);
  let error = $state('');

  // Build sections from collections — editorial (look) UI for uiStyle === 'editorial',
  // otherwise the horizontal product grid. Both read generated images from generatedCards.
  const builtSections = $derived((): (WardrobeSection | LatestSection)[] =>
    collections.map((col, ci) => {
      if (col.uiStyle === 'editorial') {
        return {
          id: `tp-${col.id}`,
          type: 'editorial' as const,
          title: col.name,
          subtitle: col.tagline,
          priority: ci,
          items: col.products.map((p) => {
            const card = generatedCards.get(p.id);
            return {
              id: p.id,
              collectionImage: card?.generatedUrl ?? p.imageUrl,
              title: p.name,
              description: p.description,
              date: '',
              price: p.price,
              brand: { name: 'TravelPro', logo: null },
              products: [{
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.imageUrl,
                redirectUrl: p.redirectUrl,
                brand: { name: 'TravelPro', logo: null },
              }],
            };
          }),
        } satisfies LatestSection;
      }

      return {
        id: `tp-${col.id}`,
        type: 'product_grid' as const,
        title: col.name,
        subtitle: col.tagline,
        backgroundImage: '',
        viewAll: false,
        priority: ci,
        items: col.products.map((p) => {
          const card = generatedCards.get(p.id);
          return {
            id: p.id,
            collectionImage: card?.generatedUrl ?? p.imageUrl,
            title: p.name,
            price: p.price,
            redirectUrl: p.redirectUrl,
            products: [{
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.imageUrl,
              redirectUrl: p.redirectUrl,
              brand: { name: 'TravelPro', logo: null },
            }],
          };
        }),
      } satisfies WardrobeSection;
    })
  );

  onMount(async () => {
    loaderMsgTimer = setInterval(() => {
      loaderMsgIndex = (loaderMsgIndex + 1) % loaderMessages.length;
    }, 2600);

    const selfie = selfieStorage.getItem('travelpro_selfie');
    if (!selfie) { goto('/'); return; }
    selfieDataUrl = selfie;

    try {
      // Restore catalogue from cache if available — skips Railway fetch entirely
      const cachedCatalogue = sessionStorage.getItem('tp_catalogue');
      let data: { collections: TravelProCollection[] };
      if (cachedCatalogue) {
        data = JSON.parse(cachedCatalogue);
      } else {
        const res = await fetch(`${BACKEND}/api/catalogue`);
        data = await res.json();
        try { sessionStorage.setItem('tp_catalogue', JSON.stringify(data)); } catch {}
      }
      collections = data.collections ?? [];

      // Init cards — restore from sessionStorage cache if available
      const initMap = new Map<string, GeneratedCard>();
      for (const col of collections) {
        for (const p of col.products) {
          const cached = sessionStorage.getItem(`tp_img_${p.id}`);
          initMap.set(p.id, cached
            ? { productId: p.id, generatedUrl: cached, status: 'done' }
            : { productId: p.id, generatedUrl: null, status: 'pending' });
        }
      }
      generatedCards = initMap;

      // Restore hero from cache if available
      const cachedHero = sessionStorage.getItem('tp_img_hero');
      if (cachedHero) {
        heroGenerated = cachedHero;
        heroStatus = 'done';
      }

      loadingCatalogue = false;

      // If everything is fully cached, reveal immediately — skip loader entirely
      const anyPending = [...initMap.values()].some(c => c.status === 'pending');
      if (!anyPending && heroStatus === 'done') {
        revealed = true;
      } else {
        generateAll();
      }
    } catch {
      error = 'Failed to load catalogue.';
      loadingCatalogue = false;
    }
  });

  async function generateAll() {
    // Hero first (one product from first 3 collections)
    generateHero();

    // Then all products with concurrency 3
    const allProducts: { product: TravelProProduct; collection: TravelProCollection; idx: number }[] = [];
    let idx = 0;
    for (const col of collections) {
      for (const p of col.products) {
        allProducts.push({ product: p, collection: col, idx: idx++ });
      }
    }

    let cursor = 0;
    async function worker() {
      while (cursor < allProducts.length) {
        const item = allProducts[cursor++];
        await generateCard(item.product, item.collection, item.idx);
      }
    }
    await Promise.all(Array.from({ length: 3 }, worker));
  }

  async function generateHero() {
    if (!selfieDataUrl || collections.length < 1) return;
    heroStatus = 'generating';
    try {
      const extraProductImageUrls = collections.slice(1, 3).map(c => c.products[0].imageUrl);
      const extraProductNames = collections.slice(1, 3).map(c => c.products[0].name);
      const res = await fetch(`${BACKEND}/api/generate-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieDataUrl,
          productImageUrl: collections[0].products[0].imageUrl,
          productName: collections[0].products[0].name,
          category: collections[0].products[0].category,
          collectionName: collections[0].name,
          collectionId: collections[0].id,
          promptType: 'hero',
          locationIdx: 0,
          extraProductImageUrls,
          extraProductNames,
        }),
        signal: AbortSignal.timeout(150000),
      });
      const data = await res.json();
      if (data.imageData) {
        heroGenerated = `data:${data.mimeType};base64,${data.imageData}`;
        heroStatus = 'done';
        try { sessionStorage.setItem('tp_img_hero', heroGenerated); } catch {}
      } else {
        heroStatus = 'error';
      }
    } catch {
      heroStatus = 'error';
    }
  }

  async function generateCard(product: TravelProProduct, collection: TravelProCollection, idx: number) {
    const updated = new Map(generatedCards);
    updated.set(product.id, { productId: product.id, generatedUrl: null, status: 'generating' });
    generatedCards = updated;

    try {
      const res = await fetch(`${BACKEND}/api/generate-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieDataUrl,
          productImageUrl: product.imageUrl,
          productName: product.name,
          category: product.category,
          collectionName: collection.name,
          collectionId: collection.id,
          promptType: 'collection',
          locationIdx: idx,
        }),
        signal: AbortSignal.timeout(150000),
      });
      const data = await res.json();
      const next = new Map(generatedCards);
      if (data.imageData) {
        const generatedUrl = `data:${data.mimeType};base64,${data.imageData}`;
        next.set(product.id, { productId: product.id, generatedUrl, status: 'done' });
        try { sessionStorage.setItem(`tp_img_${product.id}`, generatedUrl); } catch {}
      } else {
        next.set(product.id, { productId: product.id, generatedUrl: null, status: 'error' });
      }
      generatedCards = next;
    } catch {
      const next = new Map(generatedCards);
      next.set(product.id, { productId: product.id, generatedUrl: null, status: 'error' });
      generatedCards = next;
    }
  }

  const doneCount = $derived([...generatedCards.values()].filter(c => c.status === 'done' || c.status === 'error').length);
  const totalCount = $derived(generatedCards.size);

  // Gate the whole page behind the loader until catalogue is loaded, the hero is
  // resolved, and every product card has finished generating (done or errored).
  const heroResolved = $derived(heroStatus === 'done' || heroStatus === 'error');
  const allCardsResolved = $derived(totalCount > 0 && doneCount === totalCount);
  const everythingReady = $derived(!loadingCatalogue && !error && heroResolved && allCardsResolved);

  // Smooth, capped progress for the loader bar (0–100). Reflects real generation
  // progress but never sits at a dead 0 while the catalogue is still loading.
  const loaderPct = $derived(
    loadingCatalogue
      ? 6
      : totalCount === 0
        ? 12
        : Math.min(99, 12 + Math.round((doneCount / totalCount) * 88))
  );

  // Rotating tagline shown under the loader.
  const loaderMessages = [
    'Curating your Riviera wardrobe…',
    'Styling each look on La Croisette…',
    'Setting the Mediterranean light…',
    'Polishing every detail…',
    'Almost ready for your close-up…',
  ];
  let loaderMsgIndex = $state(0);
  let loaderMsgTimer: ReturnType<typeof setInterval> | undefined;

  // Reveal the page only once, so it doesn't flicker if counts briefly change.
  let revealed = $state(false);
  $effect(() => {
    if (everythingReady) revealed = true;
  });

  onDestroy(() => {
    if (loaderMsgTimer) clearInterval(loaderMsgTimer);
  });

  function recapture() {
    selfieStorage.removeItem('travelpro_selfie');
    // Clear all cached data so the next user starts fresh
    const keysToRemove = Object.keys(sessionStorage).filter(k => k.startsWith('tp_img_') || k === 'tp_catalogue');
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
    goto('/');
  }

  // Restore state on back-button navigation so images don't re-generate
  export const snapshot = {
    capture: () => ({
      heroGenerated,
      heroStatus,
      revealed,
      cards: [...generatedCards.entries()],
    }),
    restore: (s: { heroGenerated: string | null; heroStatus: typeof heroStatus; revealed: boolean; cards: [string, GeneratedCard][] }) => {
      heroGenerated = s.heroGenerated;
      heroStatus = s.heroStatus;
      revealed = s.revealed;
      generatedCards = new Map(s.cards);
    },
  };
</script>

<svelte:head>
  <title>TravelPro | Your Personal Store</title>
</svelte:head>

<Lightbox />

<div class="page">
  {#if error}
    <!-- Error state -->
    <div class="full-loader">
      <p class="err-text">{error}</p>
      <button class="white-btn" onclick={() => goto('/')}>Go Back</button>
    </div>
  {:else if !revealed}
    <!-- Full-screen premium loader — stays until hero + every card is generated -->
    <div class="brand-loader" out:fade={{ duration: 600 }}>
      <div class="loader-aurora"></div>
      <div class="loader-grain"></div>

      <div class="loader-content">
        <div class="loader-mark">
          <span class="loader-logo-glow">
            <img src="/glance-logo.svg" alt="Glance" class="loader-logo-img" />
          </span>
        </div>

        <h1 class="loader-brand">Travel Pro x Glance</h1>
        <p class="loader-kicker">Building your brand store</p>

        <div class="loader-bar">
          <div class="loader-bar-fill" style="width: {loaderPct}%"></div>
          <div class="loader-bar-shimmer"></div>
        </div>

        <div class="loader-status">
          <span class="loader-msg" >
            {#key loaderMsgIndex}
              <span in:fade={{ duration: 500 }}>{loaderMessages[loaderMsgIndex]}</span>
            {/key}
          </span>
          <span class="loader-count">
            {#if loadingCatalogue}
              Preparing
            {:else}
              {doneCount} / {totalCount}
            {/if}
          </span>
        </div>
      </div>
    </div>
  {:else}
    <div in:fade={{ duration: 700, delay: 150 }}>
      <!-- Fixed top nav — exact same style as influencer HeroSection -->
      <header class="top-nav">
        <button class="top-nav-logo" onclick={recapture} aria-label="Recapture selfie" title="Take new selfie">
          <img src="/glance-logo.svg" alt="Glance" class="top-nav-logo-img" />
        </button>

        <div class="store-title">
          <span class="store-name">Travel Pro x Glance</span>
        </div>

        <button class="recapture-btn" onclick={recapture} aria-label="New selfie">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </header>

      <!-- Hero section -->
      <TravelProHero
        generatedUrl={heroGenerated}
        status={heroStatus}
        selfieDataUrl={selfieDataUrl}
      />

      <!-- One section per collection — editorial (look) UI or horizontal grid -->
      {#each builtSections() as section (section.id)}
        {#if section.type === 'editorial'}
          <TravelProEditorialSection latestSection={section} />
        {:else}
          <TravelProWardrobeSection wardrobeSection={section} />
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .page {
    min-height: 100dvh;
    background: #111;
  }

  /* ─── Premium full-screen loader ─────────────────────────────────────────── */
  .brand-loader {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background:
      radial-gradient(120% 120% at 50% -10%, #1c2438 0%, #0d1018 55%, #07090e 100%);
    max-width: 475px;
    margin: 0 auto;
  }

  /* Slow drifting aurora wash — Riviera sea-and-gold */
  .loader-aurora {
    position: absolute;
    inset: -40%;
    background:
      radial-gradient(40% 35% at 30% 30%, rgba(118, 90, 234, 0.38), transparent 70%),
      radial-gradient(38% 30% at 72% 40%, rgba(64, 156, 214, 0.34), transparent 70%),
      radial-gradient(45% 40% at 55% 78%, rgba(212, 95, 218, 0.26), transparent 72%),
      radial-gradient(30% 28% at 18% 75%, rgba(243, 196, 107, 0.22), transparent 70%);
    filter: blur(18px);
    animation: aurora-drift 14s ease-in-out infinite alternate;
  }

  @keyframes aurora-drift {
    0%   { transform: translate3d(-4%, -2%, 0) scale(1); }
    50%  { transform: translate3d(3%, 2%, 0) scale(1.08); }
    100% { transform: translate3d(-2%, 4%, 0) scale(1.04); }
  }

  /* Subtle film grain to make it feel editorial, not flat */
  .loader-grain {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .loader-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 2rem;
    width: 100%;
    max-width: 22rem;
    text-align: center;
  }

  /* Logo */
  .loader-mark {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.75rem;
  }

  .loader-logo-glow {
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 0 16px rgba(118, 90, 234, 0.7));
    animation: logo-pulse 2.4s ease-in-out infinite;
  }

  .loader-logo-img {
    width: 3.5rem;
    height: auto;
    display: block;
  }

  @keyframes logo-pulse {
    0%, 100% { transform: scale(1);    opacity: 0.92; }
    50%      { transform: scale(1.06); opacity: 1; }
  }

  .loader-brand {
    font-family: 'Abril Fatface', serif;
    font-size: 1.6rem;
    font-weight: 400;
    color: #fff;
    letter-spacing: 0.01em;
    margin: 0;
    line-height: 1.1;
    white-space: nowrap;
  }

  .loader-kicker {
    margin: 0.5rem 0 0;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
  }

  /* Progress bar */
  .loader-bar {
    position: relative;
    width: 100%;
    height: 3px;
    margin-top: 2.5rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  .loader-bar-fill {
    position: absolute;
    inset: 0 auto 0 0;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #765aea, #409cd6 55%, #d45fda);
    box-shadow: 0 0 12px rgba(118, 90, 234, 0.7);
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .loader-bar-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.45),
      transparent
    );
    transform: translateX(-100%);
    animation: bar-shimmer 1.8s ease-in-out infinite;
  }

  @keyframes bar-shimmer {
    0%   { transform: translateX(-100%); }
    60%  { transform: translateX(100%); }
    100% { transform: translateX(100%); }
  }

  .loader-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.25rem;
    min-height: 2.5rem;
  }

  .loader-msg {
    position: relative;
    display: block;
    height: 1.1rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.82);
  }

  .loader-msg > span {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    white-space: nowrap;
  }

  .loader-count {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.4);
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .loader-aurora,
    .loader-logo-glow,
    .loader-bar-shimmer {
      animation: none;
    }
  }

  /* Exact copy of .top-nav from HeroSection.svelte */
  .top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4.875rem;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0 1rem;
    background: linear-gradient(180deg, #111111 75%, rgba(17,17,17,0) 100%);
    max-width: 475px;
    margin: 0 auto;
  }

  .top-nav-logo {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    background: none;
    cursor: pointer;
    border: none;
    padding: 0;
  }

  .top-nav-logo-img {
    height: 1.75rem;
    width: auto;
    display: block;
  }

  .store-title {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
  }

  .store-name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: rgba(255,255,255,0.85);
    letter-spacing: 0.04em;
  }

  .gen-counter {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.4);
  }

  .recapture-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(180deg, #3b3b3b 0%, #111111 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 0.67px solid rgba(255,255,255,0.3);
    color: white;
    flex-shrink: 0;
  }

  /* Progress bar */
  .progress-track {
    height: 2px;
    background: rgba(255,255,255,0.06);
    position: fixed;
    top: 4.875rem;
    left: 0; right: 0;
    z-index: 99;
    max-width: 475px;
    margin: 0 auto;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #765aea, #d45fda);
    transition: width 0.4s ease;
  }

  /* Full loader */
  .full-loader {
    min-height: 60vh;
    padding-top: 4.875rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    color: rgba(255,255,255,0.45);
    font-size: 0.9rem;
  }

  .loader-ring {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    border: 2px solid rgba(118,90,234,0.15);
    border-top-color: rgba(118,90,234,0.7);
    animation: spin 0.85s linear infinite;
  }

  @keyframes spin { to { rotate: 360deg; } }

  .err-text { color: #d32f2f; }

  .white-btn {
    background: #fff;
    color: #111;
    border: none;
    padding: 0.875rem 2rem;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
  }
</style>
