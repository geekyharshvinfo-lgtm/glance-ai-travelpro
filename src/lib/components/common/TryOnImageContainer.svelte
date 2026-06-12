<script lang="ts">
  import type { HeroProduct } from '$lib/types';
  import { navigationStore } from '$lib/stores/navigationStore.svelte';
  import { setCollectionNavData } from '$lib/utils/collectionNavigation';
  import { openCollectionDrawer } from '$lib/stores/collectionDrawer.svelte';
  import { tryOnStore } from '$lib/stores/tryOnStore.svelte';
  import GeneratingOverlay from './GeneratingOverlay.svelte';
  import OptimizedImage from './OptimizedImage.svelte';
  import { trackEvent } from '$lib/utils/analytics';
  import {
    ACTION_TYPES,
    ANALYTICS_EVENT_KEYS,
    AnalyticsEventAction,
    EVENT_TYPES,
    PAGE_NAMES,
  } from '$lib/constants/analytics';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type TryOnContainerItem = Record<string, any> & {
    id?: string;
    image?: string;
    collectionImage?: string;
    backgroundImage?: string;
    lookImage?: string;
    ai_look?: string | null;
    name?: string;
    title?: string;
    influencerSlug?: string;
    products?: Array<{ id: string }>;
    shopTheProducts?: { products: Array<{ id: string }> };
    sectionName?: string; // For analytics context
  };

  interface Props {
    item: TryOnContainerItem;
    variant?:
      | 'funk'
      | 'timeless'
      | 'latest'
      | 'wardrobe'
      | 'hero'
      | 'collection-hero'
      | 'collection-product-card';
    imageClass?: string;
    containerClass?: string;
    overlayClass?: string;
    linkUrl?: string;
    onImageLoad?: (itemId: string) => void;
    onOptimizedUrl?: (url: string) => void; // Callback with optimized URL
    preloadUrl?: string; // Preloaded optimized URL for immediate display
    sectionName?: string; // For analytics context
    pageName?: string; // For analytics context - which page this is on
    cardIndex?: number; // For analytics - which card was clicked
  }

  let {
    item,
    variant,
    imageClass = 'item-image',
    containerClass = 'image-container',
    overlayClass = 'processing-overlay',
    linkUrl,
    onImageLoad,
    onOptimizedUrl,
    preloadUrl,
    sectionName = 'unknown',
    pageName = PAGE_NAMES.HOME_PAGE,
    cardIndex
  }: Props = $props();

  // Derive try-on state from store if item.id exists
  const tryOnResult = $derived(item?.id ? tryOnStore.tryOnResults[item.id] : undefined);
  const isProcessing = $derived(item?.id ? !!tryOnStore.loadingTryOn[item.id] : false);
  const isImageLoading = $derived(item?.id ? tryOnStore.imageLoadingStates[item.id] : false);
  const elapsedTime = $derived(item?.id ? tryOnStore.elapsedTimes[item.id] || '00:00' : '00:00');

  // Get the original image URL from fallback chain
  const imageSrc = $derived(
    tryOnResult ||
      item.ai_look ||
      item.collectionImage ||
      item.image ||
      item.backgroundImage ||
      item.lookImage
  );

  // Handle navigation to collection page with product ID
  function handleLinkClick(event: Event) {
    if (linkUrl && linkUrl.includes('/collection')) {
      event.preventDefault();

      const productId = item.id || item.products?.[0]?.id || '';
      const heroImage = item.collectionImage || item.backgroundImage || item.image || '';
      const heroProducts = (item.products || item.items?.[0]?.products || []) as HeroProduct[];
      const generatedLook = tryOnResult || item.ai_look || '';

      navigationStore.setSelectedProduct(productId, heroImage, heroProducts, generatedLook);
      setCollectionNavData(productId, heroImage, heroProducts, generatedLook);

      openCollectionDrawer({
        selectedProductId: productId,
        selectedHeroImage: heroImage,
        selectedHeroProducts: heroProducts,
        generatedHeroImage: generatedLook,
      });

      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.NAVIGATION,
        [ANALYTICS_EVENT_KEYS.pageName]: pageName,
        [ANALYTICS_EVENT_KEYS.section]: sectionName || 'unknown',
        [ANALYTICS_EVENT_KEYS.productId]: productId,
        [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex !== undefined ? cardIndex : 'unknown',
      });
    }
  }

  // Use variant classes if variant is provided, otherwise fall back to passed classes
  const finalContainerClass = $derived(variant ? `image-container ${variant}` : containerClass);
  const finalImageClass = $derived(variant ? `item-image ${variant}` : imageClass);
  const finalOverlayClass = $derived(variant ? `processing-overlay ${variant}` : overlayClass);

  function handleImageLoad() {
    // Only call callback for try-on result images
    if (tryOnResult && onImageLoad && item.id) {
      onImageLoad(item.id);
    }
  }
</script>

<button class={`${finalContainerClass} image-button`} onclick={linkUrl ? handleLinkClick : null}>
  <div class={finalImageClass}>
    <OptimizedImage
      src={imageSrc}
      alt={tryOnResult ? 'Your AI-generated look' : item.name || item.title || 'Item'}
      objectFit="cover"
      objectPosition="top"
      loading={variant === 'hero' ? 'eager' : 'lazy'}
      onload={handleImageLoad}
      onOptimized={onOptimizedUrl}
      {preloadUrl}
    />
  </div>

  {#if isProcessing || isImageLoading}
    <div class={finalOverlayClass}>
      <GeneratingOverlay {elapsedTime} />
    </div>
  {/if}
</button>

<style>
  .image-container {
    position: relative;
    width: 100%;
  }

  .image-button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    display: block;
    height: 100%;
    cursor: pointer;
  }

  .processing-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.48);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Hero variant styles */
  .image-container.hero {
    display: block;
    width: 100%;
    height: 100%;
  }

  .image-container.hero .image-button {
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .item-image.hero {
    width: 100%;
    object-fit: cover;
    height: 35rem;
    object-position: top;
  }

  /* Latest variant styles */
  .image-container.latest {
    position: relative;
    width: auto;
  }

  .item-image.latest {
    width: 13.5625rem;
    height: 25.375rem;
    object-fit: cover;
    margin-left: 3rem;
  }

  .processing-overlay.latest {
    margin-left: 3rem;
    z-index: auto;
  }

  /* Timeless variant styles */
  .image-container.timeless {
    position: relative;
  }

  .item-image.timeless {
    width: 14.625rem;
    height: 100%;
    object-fit: cover;
  }

  .processing-overlay.timeless {
    z-index: 10;
  }

  /* Wardrobe variant styles */
  .image-container.wardrobe {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .item-image.wardrobe {
    display: block;
    width: 9.5rem;
    min-height: 14.375rem;
    height: 100%;
    object-fit: cover;
  }

  .processing-overlay.wardrobe {
    z-index: 10;
  }

  /* Funk variant styles */
  .image-container.funk {
    position: relative;
  }

  .item-image.funk {
    width: 14.625rem;
    height: 100%;
    object-fit: cover;
  }

  /* Collection Hero variant styles */
  .image-container.collection-hero {
    position: relative;
    width: 100%;
  }

  .item-image.collection-hero {
    width: 100%;
    height: 35rem;
    object-fit: cover;
    object-position: top;
    display: block;
    min-height: 35rem;
  }

  /* Collection Product Card variant styles */
  .image-container.collection-product-card {
    position: relative;
  }

  .item-image.collection-product-card {
    width: 100%;
    object-fit: cover;
    aspect-ratio: 3 / 4;
    object-position: top;
  }

  .processing-overlay.funk {
    z-index: 10;
  }
</style>
