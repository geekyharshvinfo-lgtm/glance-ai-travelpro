<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { GlanceGLogoIcon } from '$lib/components/icons';
  import type { WardrobeSection } from '$lib/types';
  import TravelProWardrobeSection from '$lib/components/travelpro/TravelProWardrobeSection.svelte';
  import TravelProHero from '$lib/components/travelpro/TravelProHero.svelte';
  import Footer from '$lib/components/influencer/Footer.svelte';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  const BACKEND = PUBLIC_BACKEND_URL || 'http://localhost:3006';

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

  // Build WardrobeSections from collections
  const wardrobeSections = $derived((): WardrobeSection[] =>
    collections.map((col, ci) => ({
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
            brand: { id: 'travelpro', name: 'TravelPro' },
          }],
        };
      }),
    }))
  );

  onMount(async () => {
    const selfie = localStorage.getItem('travelpro_selfie');
    if (!selfie) { goto('/'); return; }
    selfieDataUrl = selfie;

    try {
      const res = await fetch(`${BACKEND}/api/catalogue`);
      const data = await res.json();
      collections = data.collections ?? [];
      loadingCatalogue = false;

      // Init all cards as pending
      const initMap = new Map<string, GeneratedCard>();
      for (const col of collections) {
        for (const p of col.products) {
          initMap.set(p.id, { productId: p.id, generatedUrl: null, status: 'pending' });
        }
      }
      generatedCards = initMap;

      generateAll();
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
          promptType: 'collection',
          locationIdx: idx,
        }),
        signal: AbortSignal.timeout(150000),
      });
      const data = await res.json();
      const next = new Map(generatedCards);
      if (data.imageData) {
        next.set(product.id, { productId: product.id, generatedUrl: `data:${data.mimeType};base64,${data.imageData}`, status: 'done' });
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

  function recapture() {
    localStorage.removeItem('travelpro_selfie');
    goto('/');
  }
</script>

<svelte:head>
  <title>TravelPro | Your Personal Store</title>
</svelte:head>

<div class="page">
  <!-- Fixed top nav — exact same style as influencer HeroSection -->
  <header class="top-nav">
    <button class="top-nav-logo" onclick={recapture} aria-label="Recapture selfie" title="Take new selfie">
      <GlanceGLogoIcon width={23} height={30} />
    </button>

    <div class="store-title">
      <span class="store-name">TravelPro Store</span>
      {#if doneCount < totalCount && !loadingCatalogue}
        <span class="gen-counter">Generating {doneCount}/{totalCount}</span>
      {/if}
    </div>

    <button class="recapture-btn" onclick={recapture} aria-label="New selfie">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
    </button>
  </header>

  <!-- Progress bar -->
  {#if doneCount < totalCount && !loadingCatalogue}
    <div class="progress-track">
      <div class="progress-fill" style="width: {totalCount ? (doneCount / totalCount) * 100 : 0}%"></div>
    </div>
  {/if}

  {#if loadingCatalogue}
    <div class="full-loader">
      <div class="loader-ring"></div>
      <p>Loading your store…</p>
    </div>
  {:else if error}
    <div class="full-loader">
      <p class="err-text">{error}</p>
      <button class="white-btn" onclick={() => goto('/')}>Go Back</button>
    </div>
  {:else}
    <!-- Hero section -->
    <TravelProHero
      generatedUrl={heroGenerated}
      status={heroStatus}
      selfieDataUrl={selfieDataUrl}
    />

    <!-- One WardrobeSection per collection — exact same component -->
    {#each wardrobeSections() as section (section.id)}
      <TravelProWardrobeSection wardrobeSection={section} />
    {/each}

    <Footer footerData={{
      googlePlayLink: 'https://play.google.com/store/apps/details?id=com.glance.internet',
      appStoreLink: 'https://apps.apple.com/app/glance-ai/id6469480822',
      oneLinkUrl: 'https://glance.onelink.me/IpRQ/jq73oi7q',
      privacyPolicyLink: 'https://www.travelpro.com/pages/privacy-policy',
      termsOfServiceLink: 'https://www.travelpro.com/pages/terms-and-conditions',
      instagramLink: 'https://www.instagram.com/travelpro_us',
      linkedInLink: '',
      twitterLink: '',
      youtubeLink: '',
      copyrightText: '© 2025 TravelPro. All rights reserved.',
    }} />
  {/if}
</div>

<style>
  .page {
    min-height: 100dvh;
    background: #111;
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
