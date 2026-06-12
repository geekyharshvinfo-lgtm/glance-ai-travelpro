<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { PUBLIC_BACKEND_URL } from '$env/static/public';

  const BACKEND = PUBLIC_BACKEND_URL || 'http://localhost:3006';

  type Product = {
    id: string;
    name: string;
    price: string;
    category: string;
    size: string;
    imageUrl: string;
    description: string;
    redirectUrl: string;
  };

  type Collection = {
    id: string;
    name: string;
    tagline: string;
    products: Product[];
  };

  type GenCard = {
    product: Product;
    collection: Collection;
    generatedImageUrl: string | null;
    status: 'pending' | 'generating' | 'done' | 'error';
    promptType: 'collection' | 'grid' | 'hero';
    locationIdx: number;
  };

  let selfieDataUrl = $state<string | null>(null);
  let collections = $state<Collection[]>([]);
  let heroCard = $state<GenCard | null>(null);
  let collectionCards = $state<Map<string, GenCard[]>>(new Map()); // collectionId → cards
  let gridCards = $state<GenCard[]>([]);
  let loadingCatalogue = $state(true);
  let error = $state('');

  // How many are done
  const allCards = $derived(() => {
    const hero = heroCard ? [heroCard] : [];
    const coll = [...collectionCards.values()].flat();
    return [...hero, ...coll, ...gridCards];
  });
  const doneCount = $derived(() => allCards().filter(c => c.status === 'done' || c.status === 'error').length);
  const totalCount = $derived(() => allCards().length);

  onMount(async () => {
    const selfie = sessionStorage.getItem('travelpro_selfie');
    if (!selfie) { goto('/'); return; }
    selfieDataUrl = selfie;

    try {
      const res = await fetch(`${BACKEND}/api/catalogue`);
      const data = await res.json();
      collections = data.collections ?? [];
      loadingCatalogue = false;
      if (collections.length === 0) { error = 'No products found.'; return; }
      initCards();
      generateAll();
    } catch {
      error = 'Failed to load catalogue.';
      loadingCatalogue = false;
    }
  });

  function initCards() {
    // Hero card — use first product from first 3 collections
    const heroProduct = collections[0].products[0];
    heroCard = {
      product: heroProduct,
      collection: collections[0],
      generatedImageUrl: null,
      status: 'pending',
      promptType: 'hero',
      locationIdx: 0,
    };

    // Collection cards — all 6 collections, 4 products each
    const newMap = new Map<string, GenCard[]>();
    let locIdx = 0;
    for (const col of collections) {
      const cards: GenCard[] = col.products.map(p => ({
        product: p,
        collection: col,
        generatedImageUrl: null,
        status: 'pending',
        promptType: 'collection',
        locationIdx: locIdx++,
      }));
      newMap.set(col.id, cards);
    }
    collectionCards = newMap;

    // Grid cards — 1 product per collection (first 6), different locations
    gridCards = collections.slice(0, 6).map((col, i) => ({
      product: col.products[Math.min(1, col.products.length - 1)], // take 2nd product for variety
      collection: col,
      generatedImageUrl: null,
      status: 'pending',
      promptType: 'grid',
      locationIdx: i + 6,
    }));
  }

  async function generateAll() {
    // Priority order: hero first, then grid concurrently, then all collection cards
    if (heroCard) await generateCard(heroCard, 'hero');

    // Grid + first 3 collections in parallel (concurrency 3)
    const gridAndFirst3 = [
      ...gridCards,
      ...[...collectionCards.values()].slice(0, 3).flat(),
    ];
    await runConcurrent(gridAndFirst3, 3);

    // Remaining 3 collections
    const last3 = [...collectionCards.values()].slice(3).flat();
    await runConcurrent(last3, 3);
  }

  async function runConcurrent(cards: GenCard[], concurrency: number) {
    let idx = 0;
    async function worker() {
      while (idx < cards.length) {
        const card = cards[idx++];
        await generateCard(card, card.promptType);
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  async function generateCard(card: GenCard, promptType: string) {
    card.status = 'generating';
    try {
      // Extra product images for hero
      const extraProductImageUrls = promptType === 'hero'
        ? collections.slice(1, 3).map(c => c.products[0].imageUrl)
        : [];
      const extraProductNames = promptType === 'hero'
        ? collections.slice(1, 3).map(c => c.products[0].name)
        : [];

      const res = await fetch(`${BACKEND}/api/generate-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieDataUrl: selfieDataUrl,
          productImageUrl: card.product.imageUrl,
          productName: card.product.name,
          category: card.product.category,
          collectionName: card.collection.name,
          promptType,
          locationIdx: card.locationIdx,
          extraProductImageUrls,
          extraProductNames,
        }),
        signal: AbortSignal.timeout(150000),
      });
      const data = await res.json();
      if (data.imageData) {
        card.generatedImageUrl = `data:${data.mimeType};base64,${data.imageData}`;
        card.status = 'done';
      } else {
        card.status = 'error';
      }
    } catch {
      card.status = 'error';
    }
    // Trigger reactivity
    collectionCards = new Map(collectionCards);
    gridCards = [...gridCards];
  }

  function recapture() {
    sessionStorage.removeItem('travelpro_selfie');
    goto('/');
  }

  function cardImg(card: GenCard): string {
    return card.generatedImageUrl ?? card.product.imageUrl;
  }

  function isLoading(card: GenCard): boolean {
    return card.status === 'pending' || card.status === 'generating';
  }
</script>

<div class="page">
  <!-- Sticky header -->
  <header>
    <div class="brand-logo">
      <span class="brand-tp">TRAVEL</span><span class="brand-pro">PRO</span>
    </div>
    <div class="header-right">
      {#if doneCount() < totalCount()}
        <div class="gen-pill">
          <div class="gen-dot"></div>
          Generating {doneCount()}/{totalCount()}
        </div>
      {/if}
      <button class="recapture-btn" onclick={recapture}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        New Selfie
      </button>
    </div>
  </header>

  <!-- Progress bar -->
  {#if doneCount() < totalCount() && !loadingCatalogue}
    <div class="progress-track">
      <div class="progress-fill" style="width: {totalCount() ? (doneCount() / totalCount()) * 100 : 0}%"></div>
    </div>
  {/if}

  {#if loadingCatalogue}
    <div class="full-loader">
      <div class="spinner"></div>
      <p>Loading your store…</p>
    </div>
  {:else if error}
    <div class="full-loader">
      <p class="err">{error}</p>
      <button class="btn-primary" onclick={() => goto('/')}>Go Back</button>
    </div>
  {:else}
    <main>
      <!-- ── HERO SECTION ─────────────────────────────────────────── -->
      {#if heroCard}
        <section class="hero-section">
          <div class="hero-image-wrap">
            {#if heroCard.generatedImageUrl}
              <img src={heroCard.generatedImageUrl} alt="Your TravelPro look" class="hero-img" />
            {:else}
              <div class="hero-placeholder">
                <img src={selfieDataUrl ?? ''} alt="" class="hero-selfie-bg" />
                <div class="hero-loader-overlay">
                  <div class="spinner"></div>
                  <p>Creating your hero look…</p>
                </div>
              </div>
            {/if}
            <div class="hero-gradient"></div>
            <div class="hero-text">
              <p class="hero-eyebrow">Your TravelPro Journey</p>
              <h1 class="hero-title">The World Awaits.</h1>
              <p class="hero-sub">Curated just for you.</p>
            </div>
          </div>
        </section>
      {/if}

      <!-- ── COLLECTIONS 1–3 ─────────────────────────────────────── -->
      {#each collections.slice(0, 3) as collection}
        {@const cards = collectionCards.get(collection.id) ?? []}
        <section class="collection-section">
          <div class="collection-header">
            <div>
              <h2 class="collection-name">{collection.name}</h2>
              <p class="collection-tagline">{collection.tagline}</p>
            </div>
            <a href="https://www.travelpro.com/collections/{collection.id}" target="_blank" rel="noopener" class="shop-link">
              Shop All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          <div class="cards-scroll">
            {#each cards as card}
              <a href={card.product.redirectUrl} target="_blank" rel="noopener" class="product-card">
                <div class="card-img-wrap">
                  <img
                    src={cardImg(card)}
                    alt={card.product.name}
                    class="card-img"
                    class:placeholder={isLoading(card)}
                  />
                  {#if isLoading(card)}
                    <div class="card-gen-overlay">
                      <div class="mini-spin"></div>
                    </div>
                  {/if}
                  <div class="card-badge">{card.product.size}</div>
                </div>
                <div class="card-info">
                  <p class="card-name">{card.product.name}</p>
                  <p class="card-price">{card.product.price}</p>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/each}

      <!-- ── GRID SECTION ───────────────────────────────────────────── -->
      <section class="grid-section">
        <div class="grid-header">
          <p class="grid-eyebrow">Around The World</p>
          <h2 class="grid-title">Your Style, Every Destination.</h2>
        </div>
        <div class="luggage-grid">
          {#each gridCards as card, i}
            <a href={card.product.redirectUrl} target="_blank" rel="noopener" class="grid-card {i === 0 ? 'grid-card--wide' : ''}">
              <div class="grid-img-wrap">
                <img
                  src={cardImg(card)}
                  alt={card.product.name}
                  class="grid-img"
                  class:placeholder={isLoading(card)}
                />
                {#if isLoading(card)}
                  <div class="card-gen-overlay">
                    <div class="mini-spin"></div>
                  </div>
                {/if}
                <div class="grid-card-info">
                  <p class="grid-card-col">{card.collection.name}</p>
                  <p class="grid-card-name">{card.product.name}</p>
                  <p class="grid-card-price">{card.product.price}</p>
                </div>
              </div>
            </a>
          {/each}
        </div>
      </section>

      <!-- ── COLLECTIONS 4–6 ─────────────────────────────────────── -->
      {#each collections.slice(3, 6) as collection}
        {@const cards = collectionCards.get(collection.id) ?? []}
        <section class="collection-section">
          <div class="collection-header">
            <div>
              <h2 class="collection-name">{collection.name}</h2>
              <p class="collection-tagline">{collection.tagline}</p>
            </div>
            <a href="https://www.travelpro.com/collections/{collection.id}" target="_blank" rel="noopener" class="shop-link">
              Shop All
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>
          <div class="cards-scroll">
            {#each cards as card}
              <a href={card.product.redirectUrl} target="_blank" rel="noopener" class="product-card">
                <div class="card-img-wrap">
                  <img
                    src={cardImg(card)}
                    alt={card.product.name}
                    class="card-img"
                    class:placeholder={isLoading(card)}
                  />
                  {#if isLoading(card)}
                    <div class="card-gen-overlay">
                      <div class="mini-spin"></div>
                    </div>
                  {/if}
                  <div class="card-badge">{card.product.size}</div>
                </div>
                <div class="card-info">
                  <p class="card-name">{card.product.name}</p>
                  <p class="card-price">{card.product.price}</p>
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/each}

      <!-- ── FOOTER ─────────────────────────────────────────────── -->
      <footer class="store-footer">
        <div class="footer-brand">
          <span class="brand-tp">TRAVEL</span><span class="brand-pro">PRO</span>
        </div>
        <p class="footer-tagline">Built for the journey. Designed for the destination.</p>
        <a href="https://www.travelpro.com" target="_blank" rel="noopener" class="footer-link">Visit TravelPro.com →</a>
      </footer>
    </main>
  {/if}
</div>

<style>
  .page {
    min-height: 100dvh;
    background: #080808;
    color: #fff;
  }

  /* ─ Header ─ */
  header {
    position: sticky;
    top: 0;
    z-index: 20;
    padding: 0.875rem 1.25rem;
    background: rgba(8,8,8,0.9);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .brand-logo { font-size: 1rem; font-weight: 900; letter-spacing: 0.14em; }
  .brand-tp { color: #fff; }
  .brand-pro { color: #4f9cf9; }

  .header-right { display: flex; align-items: center; gap: 0.75rem; }

  .gen-pill {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.72rem;
    color: rgba(255,255,255,0.45);
    background: rgba(255,255,255,0.05);
    padding: 0.3rem 0.7rem;
    border-radius: 20px;
  }

  .gen-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #4f9cf9;
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .recapture-btn {
    display: flex; align-items: center; gap: 0.35rem;
    background: rgba(79,156,249,0.1);
    color: #4f9cf9;
    border: 1px solid rgba(79,156,249,0.2);
    border-radius: 20px;
    padding: 0.35rem 0.8rem;
    font-size: 0.78rem; font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }
  .recapture-btn:hover { background: rgba(79,156,249,0.18); }

  /* ─ Progress ─ */
  .progress-track {
    height: 2px;
    background: rgba(255,255,255,0.04);
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4f9cf9, #a78bfa);
    transition: width 0.5s ease;
  }

  /* ─ Full loader ─ */
  .full-loader {
    min-height: 60vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 1.25rem; color: rgba(255,255,255,0.45);
    font-size: 0.9rem;
  }
  .err { color: #ff6b6b; }
  .btn-primary {
    background: #4f9cf9; color: #fff; border: none;
    border-radius: 12px; padding: 0.875rem 1.5rem;
    font-size: 0.95rem; font-weight: 700; cursor: pointer;
  }

  /* ─ Spinner ─ */
  .spinner {
    width: 44px; height: 44px; border-radius: 50%;
    border: 3px solid rgba(79,156,249,0.15);
    border-top-color: #4f9cf9;
    animation: spin 0.85s linear infinite;
  }
  .mini-spin {
    width: 24px; height: 24px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.15);
    border-top-color: #fff;
    animation: spin 0.75s linear infinite;
  }
  @keyframes spin { to { rotate: 360deg; } }

  main { padding-bottom: 4rem; }

  /* ─ HERO ─ */
  .hero-section {
    position: relative;
    width: 100%;
    aspect-ratio: 9/14;
    max-height: 92vh;
    overflow: hidden;
  }

  .hero-image-wrap {
    position: relative;
    width: 100%; height: 100%;
  }

  .hero-img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
  }

  .hero-placeholder {
    width: 100%; height: 100%;
    position: relative; overflow: hidden;
    background: #111;
  }

  .hero-selfie-bg {
    width: 100%; height: 100%;
    object-fit: cover;
    filter: blur(20px) brightness(0.3);
    transform: scale(1.1);
  }

  .hero-loader-overlay {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 1rem; color: rgba(255,255,255,0.6);
    font-size: 0.85rem;
  }

  .hero-gradient {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 55%;
    background: linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.5) 50%, transparent 100%);
    pointer-events: none;
  }

  .hero-text {
    position: absolute; bottom: 2rem; left: 1.5rem; right: 1.5rem;
  }

  .hero-eyebrow {
    font-size: 0.72rem; letter-spacing: 0.16em;
    text-transform: uppercase; color: #4f9cf9;
    margin-bottom: 0.5rem;
  }

  .hero-title {
    font-size: 2.5rem; font-weight: 900; line-height: 1.05;
    letter-spacing: -0.02em; margin-bottom: 0.4rem;
  }

  .hero-sub {
    font-size: 0.9rem; color: rgba(255,255,255,0.55);
  }

  /* ─ COLLECTION SECTION ─ */
  .collection-section {
    padding: 2.5rem 0 0.5rem;
  }

  .collection-header {
    display: flex; align-items: flex-start;
    justify-content: space-between;
    padding: 0 1.25rem 1.25rem;
  }

  .collection-name {
    font-size: 1.15rem; font-weight: 800;
    letter-spacing: -0.01em; margin-bottom: 0.25rem;
  }

  .collection-tagline {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.4);
    font-style: italic;
  }

  .shop-link {
    display: flex; align-items: center; gap: 0.3rem;
    font-size: 0.78rem; font-weight: 600;
    color: #4f9cf9; text-decoration: none;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 0.2rem;
  }

  .cards-scroll {
    display: flex; gap: 0.75rem;
    overflow-x: auto; padding: 0 1.25rem 1rem;
    scrollbar-width: none;
  }
  .cards-scroll::-webkit-scrollbar { display: none; }

  .product-card {
    flex: 0 0 42vw; max-width: 180px;
    border-radius: 16px; overflow: hidden;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    text-decoration: none; color: inherit;
    transition: transform 0.15s;
  }
  .product-card:active { transform: scale(0.97); }

  .card-img-wrap {
    position: relative;
    aspect-ratio: 3/4;
    background: #111; overflow: hidden;
  }

  .card-img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: opacity 0.4s;
  }
  .card-img.placeholder {
    opacity: 0.25;
    filter: blur(2px) saturate(0.3);
  }

  .card-gen-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
  }

  .card-badge {
    position: absolute; top: 0.5rem; left: 0.5rem;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(6px);
    font-size: 0.62rem; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: rgba(255,255,255,0.8);
    padding: 0.25rem 0.5rem; border-radius: 6px;
  }

  .card-info { padding: 0.65rem 0.75rem 0.85rem; }

  .card-name {
    font-size: 0.76rem; font-weight: 600;
    line-height: 1.35; margin-bottom: 0.3rem;
    color: rgba(255,255,255,0.85);
  }

  .card-price {
    font-size: 0.82rem; font-weight: 800;
    color: #4f9cf9;
  }

  /* ─ GRID SECTION ─ */
  .grid-section {
    padding: 3rem 1.25rem 0.5rem;
  }

  .grid-header {
    margin-bottom: 1.5rem;
  }

  .grid-eyebrow {
    font-size: 0.72rem; letter-spacing: 0.16em;
    text-transform: uppercase; color: #4f9cf9;
    margin-bottom: 0.5rem;
  }

  .grid-title {
    font-size: 1.5rem; font-weight: 900;
    letter-spacing: -0.02em; line-height: 1.1;
  }

  .luggage-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    gap: 0.625rem;
  }

  .grid-card {
    display: block; text-decoration: none; color: inherit;
    border-radius: 16px; overflow: hidden;
    position: relative;
    transition: transform 0.15s;
  }
  .grid-card:active { transform: scale(0.98); }

  .grid-card--wide {
    grid-column: 1 / -1;
  }

  .grid-img-wrap {
    position: relative;
    aspect-ratio: 1;
    background: #111; overflow: hidden;
  }

  .grid-card--wide .grid-img-wrap {
    aspect-ratio: 16/10;
  }

  .grid-img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: opacity 0.4s;
  }
  .grid-img.placeholder {
    opacity: 0.2;
    filter: blur(3px) saturate(0.3);
  }

  .grid-card-info {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%);
    padding: 1.5rem 0.875rem 0.875rem;
  }

  .grid-card-col {
    font-size: 0.62rem; letter-spacing: 0.1em;
    text-transform: uppercase; color: #4f9cf9;
    margin-bottom: 0.2rem;
  }

  .grid-card-name {
    font-size: 0.82rem; font-weight: 700;
    line-height: 1.3; margin-bottom: 0.2rem;
  }

  .grid-card-price {
    font-size: 0.78rem; font-weight: 800;
    color: rgba(255,255,255,0.75);
  }

  /* ─ FOOTER ─ */
  .store-footer {
    margin-top: 4rem;
    padding: 2.5rem 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex; flex-direction: column;
    align-items: center; gap: 0.75rem;
    text-align: center;
  }

  .footer-brand { font-size: 1.1rem; font-weight: 900; letter-spacing: 0.14em; }

  .footer-tagline {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.35);
    font-style: italic;
  }

  .footer-link {
    font-size: 0.82rem; font-weight: 600;
    color: #4f9cf9; text-decoration: none;
  }
</style>
