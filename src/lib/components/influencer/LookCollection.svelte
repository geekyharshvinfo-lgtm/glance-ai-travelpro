<script lang="ts">
  import type { Influencer } from '$lib/types';
  import { onMount } from 'svelte';
  import { ChatIcon, StyleMeWhiteIcon } from '../icons';
  import TryOnImageContainer from '$lib/components/common/TryOnImageContainer.svelte';
  import { useTryOn } from '$lib/composables/useTryOn.svelte';
  import type { TryOnItem } from '$lib/utils/tryOnUtil';
  import { goto } from '$app/navigation';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { useHorizontalScrollRestore } from '$lib/utils/useHorizontalScrollRestore';
  import type { LookCollection, LookCollectionSection } from '$lib/types/influencer';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import { trackEvent } from '$lib/utils/analytics';
  import OptimizedImage from '../common/OptimizedImage.svelte';
  import { handleChatMessageSend } from '$lib/utils/chat';
  import { useScrollPreloader } from '$lib/utils/useScrollPreloader.svelte';

  interface LookCollectionProps {
    lookCollectionSection: LookCollectionSection;
    influencer: Influencer;
  }

  let { lookCollectionSection, influencer }: LookCollectionProps = $props();

  const productCap = $derived(influencer.slug === 'oprah-winfrey' ? 1 : 2);

  // Store optimized URLs for reuse in backgrounds
  let optimizedUrls = $state<Record<string, string>>({});

  // Initialize try-on composable
  const styleMeHandler = $derived(useTryOn(influencer.id));

  // Extract methods and reactive state from the composable
  const isButtonDisabled = $derived(styleMeHandler.isButtonDisabled);
  const composableHandleStyleMeClick = $derived(styleMeHandler.handleStyleMeClick);

  let activeIndex = $state(0);
  let collectionGrid: HTMLElement | undefined = $state();
  useHorizontalScrollRestore('timeless', () => collectionGrid);
  useScrollPreloader(() => collectionGrid, '.collection-item');

  function handleAskClick(collection: LookCollection, cardIndex: number) {
    // Track Ask button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.ASK_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: lookCollectionSection.title,
      [ANALYTICS_EVENT_KEYS.productId]: collection.id,
      [ANALYTICS_EVENT_KEYS.productName]: collection.title,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    });
    
    handleChatMessageSend('Find me something similar', { url: collection.collectionImage });
    goto(`/${influencer.slug}/chat`);
  }

  onMount(() => {
    if (!collectionGrid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              activeIndex = index;
            }
          }
        });
      },
      {
        root: collectionGrid,
        threshold: 0.6,
      }
    );

    const items = collectionGrid.querySelectorAll('.collection-item');
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  });

  async function handleStyleMeClick(collection: LookCollection, cardIndex: number) {
    // Map collection to TryOnItem interface
    const tryOnItem: TryOnItem = {
      id: collection.id,
      image: collection.collectionImage,
      name: collection.title,
      type: 'clothing',
      brandPersona: 'Timeless classic collection',
    };

    const eventOptions = {
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: lookCollectionSection.title,
      cardIndex,
    };

    // Use composable's handler directly
    await composableHandleStyleMeClick(tryOnItem, eventOptions);
  }

  function handleProductCardClick(product: LookCollection['products'][number], cardIndex: number) {
    // Track product card click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PRODUCT_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: lookCollectionSection.title,
      [ANALYTICS_EVENT_KEYS.productId]: product.id,
      [ANALYTICS_EVENT_KEYS.productName]: product.name,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    });
  }
</script>

<section class="section">
  <div class="section-header">
    <h2 class="section-title">{lookCollectionSection.title}</h2>
    <p class="section-subtitle">{lookCollectionSection.subtitle}</p>
  </div>
  <div class="section-content">
    <div class="collection-grid" bind:this={collectionGrid}>
      {#each lookCollectionSection.items as collection, index (collection.id)}
        {@const itemId = collection.id}
        {@const itemIsDisabled = isButtonDisabled(itemId)}
        {@const bgUrl = optimizedUrls[collection.id]}
        <div class="collection-item" class:active={index === activeIndex} data-index={index} data-item-id={collection.id} data-preload-url={optimizedUrls[collection.id]}>
          <div class="collection-image">
            <TryOnImageContainer
              item={collection}
              variant="timeless"
              onImageLoad={styleMeHandler.handleTryOnImageLoadComplete}
              onOptimizedUrl={(url) => { optimizedUrls[collection.id] = url; }}
              linkUrl="/{influencer.slug}/collection"
              sectionName={lookCollectionSection.title}
              cardIndex={index}
            />
            <div class="collection-image-overlay">
              {#if !itemIsDisabled}
                <button class="try-on-btn" onclick={() => handleStyleMeClick(collection, index)}>
                  <StyleMeWhiteIcon />
                  Style Me
                </button>
              {/if}
              <button class="ask-button" onclick={() => handleAskClick(collection, index)}>
                <ChatIcon class="ask-icon" />
              </button>
            </div>
          </div>

          <div class="product-col">
            <div class="product-col-bg" style="background-image: url({bgUrl});"></div>
            {#if productCap > 1}
              <div class="product-col-line"></div>
            {/if}
            <div class="product-col-content">
              {#each collection.products as product, productIndex (product.id)}
                {#if productIndex < productCap}
                  <a href={product.redirectUrl} onclick={() => handleProductCardClick(product, index)}>
                    <div class="product-item">
                      <div class="product-image-wrapper">
                        <div class="product-image">
                          <OptimizedImage
                            src={product.image}
                            alt={product.name}
                          />
                        </div>
                      </div>
                      <div class="product-info">
                        <p class="product-brand">{product.brand?.name}</p>
                        <p class="product-price">{product.price}</p>
                      </div>
                    </div>
                  </a>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .section {
    padding: 1.5rem 1rem;
    background: rgba(29, 29, 29, 1);
  }

  .section-header {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .section-title {
    font-family: 'Playfair Display';
    font-size: 1.375rem;
    font-weight: 500;
    letter-spacing: 0%;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
  }

  .section-subtitle {
    font-weight: 500;
    font-size: 0.8125rem;
    line-height: 1.125rem;
    letter-spacing: 0%;
    text-align: center;
    color: white;
  }

  .section-content {
    position: relative;
    margin-top: 2rem;
  }

  .collection-grid {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    margin: 0 -1rem;
    padding: 0 1rem;
    -ms-overflow-style: none;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .collection-item {
    display: flex;
    min-width: 85vw;
    width: 85vw;
    height: 26.4rem;
    scroll-snap-align: center;
    flex-shrink: 0;
    transform: scale(0.9);
    transition: transform 0.3s ease;
    opacity: 0.6;
  }

  .collection-item.active {
    transform: scale(1);
    opacity: 1;
  }

  .collection-image-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1rem;
    gap: 1rem;
  }

  .try-on-btn {
    height: 2.5rem;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    gap: 0.75rem;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-decoration: none;
    background: linear-gradient(94.33deg, #111111 0%, #424242 98.94%);
    border: 1px solid rgba(255, 255, 255, 0.21);
    cursor: pointer;
    text-transform: uppercase;
  }

  .collection-image {
    position: relative;
  }

  .product-col {
    position: relative;
    height: 100%;
    min-width: 7.375rem;
    border: 1.1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
  }

  .product-col-bg {
    position: absolute;
    inset: 0;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
    filter: blur(4px);
    transform: scale(1.1);
  }

  .product-col-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.19);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
  }

  .product-col-line {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.3) 20%,
      rgba(255, 255, 255, 0.3) 80%,
      transparent 100%
    );
  }

  .product-col-content {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    padding: 1.5rem 0;
  }

  .product-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .product-image-wrapper {
    width: 4.25rem;
    height: 4.25rem;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(255, 255, 255, 0);
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.125rem;
  }

  .product-brand {
    font-size: 0.578rem;
    font-weight: 400;
    text-transform: uppercase;
    color: white;
    text-align: center;
  }

  .product-price {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: white;
  }

  .ask-button {
    height: 2.5rem;
    width: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(94.33deg, #111111 0%, #424242 98.94%);
    border: 1px solid rgba(255, 255, 255, 0.21);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
</style>
