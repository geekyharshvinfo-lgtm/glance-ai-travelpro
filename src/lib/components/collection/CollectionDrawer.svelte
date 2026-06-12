<script lang="ts">
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import {
    collectionDrawerStore,
    closeCollectionDrawer,
  } from '$lib/stores/collectionDrawer.svelte';
  import CollectionHeader from './CollectionHeader.svelte';
  import CollectionHero from './CollectionHero.svelte';
  import CollectionProductList from './CollectionProductList.svelte';
  import LookGridSection from './LookGridSection.svelte';
  import type { CollectionData, HeroProduct } from '$lib/types';
  import { getCollectionNavData } from '$lib/utils/collectionNavigation';
  import { getCollectionBySlug } from '$lib/api';
  import { getSectionProducts } from '$lib/api/influencer';
  import { userStore } from '$lib/stores/user.svelte';
  import { trackEvent } from '$lib/utils/analytics';
  import { ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, PERFORMANCE_EVENT_ACTIONS, SECTION_NAMES } from '$lib/constants/analytics';

  interface Props {
    slug?: string;
    influencerId?: string;
    gender: string;
  }

  let { slug = '', influencerId, gender }: Props = $props();

  let isOpen = $derived(collectionDrawerStore.isOpen);
  let mode = $derived(collectionDrawerStore.mode);
  let collection: CollectionData | null = $derived(collectionDrawerStore.collection);
  let collectionLoading = $derived(collectionDrawerStore.collectionLoading);
  let selectedProductId: string | null = $derived(collectionDrawerStore.selectedProductId);
  let selectedHeroImage: string | null = $derived(collectionDrawerStore.selectedHeroImage);
  let generatedHeroImage: string | null = $derived(collectionDrawerStore.generatedHeroImage);
  let selectedHeroProducts: HeroProduct[] = $derived(collectionDrawerStore.selectedHeroProducts);
  let gridData = $derived(collectionDrawerStore.gridData);
  let sectionId = $derived(collectionDrawerStore.sectionId);
  let influencerSlug = $derived(collectionDrawerStore.influencerSlug);

  $effect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  });

  $effect(() => {
    if (!isOpen) {
      collectionDrawerStore.collection = null;
      collectionDrawerStore.collectionLoading = false;
      return;
    }

    // Handle productGrid mode with API fetch
    if (mode === 'productGrid') {
      async function fetchGridData() {
        if (!sectionId || !influencerSlug) {
          collectionDrawerStore.collectionLoading = false;
          return;
        }

        try {
          const response = await getSectionProducts(
            influencerSlug,
            sectionId,
            {
              profileId: userStore.profileId || undefined,
              accountId: userStore.accountId || undefined,
            }
          );

          collectionDrawerStore.gridData = response;
        } catch (err) {
          console.error('Failed to fetch section products:', err);
          // Show error or keep shimmer? For now, just stop loading
        } finally {
          collectionDrawerStore.collectionLoading = false;
        }
      }

      fetchGridData();
      return;
    }

    async function fetchData() {
      let productId = selectedProductId;
      let heroImg = selectedHeroImage;
      let heroProductsLocal = selectedHeroProducts;
      let generatedImg = generatedHeroImage;

      // fallback
      if (!productId || !heroImg || heroProductsLocal.length === 0 || generatedImg === null) {
        const navData = getCollectionNavData();

        if (navData) {
          productId = navData.productId;
          heroImg = navData.heroImage;
          heroProductsLocal = navData.heroProducts;
          generatedImg = navData.generatedLook || null;
        }
      }

      if (!productId) return;

      try {
        collectionDrawerStore.collectionLoading = true;

        const country = slug === 'oprah-winfrey' ? 'US' : 'IN';
        const apiProductId = heroProductsLocal?.[0]?.id || productId;
        const result = await getCollectionBySlug(slug, {
          productId: apiProductId,
          country,
          gender: gender,
          maxResults: 15,
        });

        collectionDrawerStore.collection = result;
      } catch (err) {
        console.error('Failed to fetch collection data:', err);
      } finally {
        collectionDrawerStore.collectionLoading = false;
      }
    }

    fetchData();
  });

  function slideIn(_node: HTMLElement) {
    return {
      duration: 300,
      easing: cubicOut,
      css: (t: number) => `transform: translateX(${(1 - t) * 100}%)`,
    };
  }

  function slideOut(_node: HTMLElement) {
    return {
      duration: 250,
      easing: cubicOut,
      css: (t: number) => `transform: translateX(${(1 - t) * 100}%)`,
    };
  }

  function handleClose() {
    closeCollectionDrawer();

    // track event for collection drawer close
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: PERFORMANCE_EVENT_ACTIONS.COLLECTION_PAGE_CLOSED,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.COLLECTION_PAGE_BACK_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.COLLECTION_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.COLLECTION,
      [ANALYTICS_EVENT_KEYS.label]: 'close_collection_drawer',
    });
  }

  const productCap = $derived(slug === 'oprah-winfrey' ? 1 : 3);
  const heroProducts = $derived(selectedHeroProducts.slice(0, productCap));
  const heroImage = $derived(selectedHeroImage || '');
  const generatedHero = $derived(generatedHeroImage || '');
</script>

{#if isOpen}
  <div class="collection-overlay" transition:fade={{ duration: 300 }}>
    <div class="collection-panel" in:slideIn out:slideOut>
      <CollectionHeader {slug} onBack={handleClose} />
      
      {#if mode === 'collection'}
        <CollectionHero
          id={selectedProductId || ''}
          imageUrl={generatedHero || heroImage}
          {influencerId}
          isStyleMeDisabled={generatedHero ? true : false}
        />
        {#if heroProducts.length > 0}
          <CollectionProductList products={heroProducts} />
        {/if}
        <div class="divider"></div>
      {/if}
      {#if mode === 'productGrid' && gridData}
        <div style:display="contents">
          <LookGridSection homeSection={gridData} {influencerId} isFromViewAll={true} />
        </div>
      {:else if collectionLoading}
        <div class="skeleton-section">
          <div class="skeleton-header">
            <div class="skeleton-title shimmer"></div>
            <div class="skeleton-subtitle shimmer"></div>
          </div>
          <div class="skeleton-grid">
            {#each Array(6) as _, i (i)}
              <div class="skeleton-card">
                <div class="skeleton-image shimmer"></div>
                <div class="skeleton-details">
                  <div class="skeleton-thumb shimmer"></div>
                  <div class="skeleton-info">
                    <div class="skeleton-name shimmer"></div>
                    <div class="skeleton-price shimmer"></div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else if !collection?.sections?.selectedForYou?.products?.length}
        <div class="loading-suggestions">
          <span>Failed to load suggestions</span>
        </div>
      {/if}
      <div
        style:display={collection?.sections?.selectedForYou?.products?.length ? 'contents' : 'none'}
      >
        <LookGridSection
          section={collection?.sections?.selectedForYou ?? {
            title: '',
            subtitle: '',
            products: [],
          }}
          {influencerId}
        />
      </div>
    </div>
  </div>
{/if}

<style>
  .collection-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1234;
  }
  .collection-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    max-width: 420px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background: #181818;
    color: white;
    margin: 0 auto;
  }
  .divider {
    width: 80%;
    height: 1px;
    min-height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 20%,
      rgba(255, 255, 255, 0.3) 80%,
      transparent 100%
    );
    margin: 2.5rem 0;
    align-self: center;
  }
  .skeleton-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0 1rem;
    box-sizing: border-box;
  }
  .skeleton-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .skeleton-title {
    width: 10rem;
    height: 1.375rem;
    border-radius: 4px;
  }
  .skeleton-subtitle {
    width: 14rem;
    height: 1.125rem;
    border-radius: 4px;
  }
  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    width: 100%;
    margin-top: 2rem;
  }
  .skeleton-card {
    background: #222;
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .skeleton-image {
    width: 100%;
    height: 120px;
    background: #333;
    border-radius: 8px;
  }
  .skeleton-details {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .skeleton-thumb {
    width: 40px;
    height: 40px;
    background: #444;
    border-radius: 50%;
  }
  .skeleton-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .skeleton-name,
  .skeleton-price {
    height: 0.75rem;
    background: #444;
    border-radius: 4px;
  }
  .skeleton-name {
    width: 60%;
  }
  .skeleton-price {
    width: 40%;
  }
  .shimmer {
    animation: shimmer 1.5s infinite linear;
    background: linear-gradient(90deg, #222 25%, #333 50%, #222 75%);
    background-size: 200% 100%;
  }
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  .loading-suggestions {
    text-align: center;
    color: #aaa;
    margin: 2rem 0;
  }
  @media (max-width: 480px) {
    .collection-panel {
      max-width: 100%;
    }
  }
</style>
