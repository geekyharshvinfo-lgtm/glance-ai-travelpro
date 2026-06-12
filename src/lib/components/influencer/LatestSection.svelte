<script lang="ts">
  import type { LatestSection, Influencer, LatestItem } from '$lib/types';
  import { ChatIcon, StyleMeWhiteIcon } from '../icons';
  import TryOnImageContainer from '$lib/components/common/TryOnImageContainer.svelte';
  import { useTryOn } from '$lib/composables/useTryOn.svelte';
  import type { TryOnItem } from '$lib/utils/tryOnUtil';
  import { goto } from '$app/navigation';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { useHorizontalScrollRestore } from '$lib/utils/useHorizontalScrollRestore';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import { trackEvent } from '$lib/utils/analytics';
  import OptimizedImage from '../common/OptimizedImage.svelte';
  import { handleChatMessageSend } from '$lib/utils/chat';
  import { useScrollPreloader } from '$lib/utils/useScrollPreloader.svelte';

  interface LatestSectionProps {
    latestSection: LatestSection;
    influencer: Influencer;
  }

  let { latestSection, influencer }: LatestSectionProps = $props();

  // Initialize try-on composable
  const styleMeHandler = $derived(useTryOn(influencer.id));

  // Extract methods and reactive state from the composable
  const isButtonDisabled = $derived(styleMeHandler.isButtonDisabled);
  const composableHandleStyleMeClick = $derived(styleMeHandler.handleStyleMeClick);

  // Section-specific functionality
  let productsScroll: HTMLDivElement | undefined = $state();
  let activeIndex = $state(0);
  let optimizedUrls = $state<Record<string, string>>({});
  useHorizontalScrollRestore('latest', () => productsScroll);
  useScrollPreloader(() => productsScroll, '.product-card');

  function handleAskClick(item: LatestItem, cardIndex: number) {
    // Track Ask button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.ASK_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: latestSection.title,
      [ANALYTICS_EVENT_KEYS.productId]: item.id,
      [ANALYTICS_EVENT_KEYS.productName]: item.title,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    });

    handleChatMessageSend('Find me something similar', { url: item.collectionImage });
    goto(`/${influencer.slug}/chat`);
  }

  let scrollRaf: number | undefined;
  const handleScroll = () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = undefined;
      if (!productsScroll) return;
      activeIndex = Math.round(productsScroll.scrollLeft / productsScroll.clientWidth);
    });
  };

  const scrollToIndex = (index: number) => {
    if (!productsScroll) return;
    const itemWidth = productsScroll.clientWidth;
    productsScroll.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
  };

  async function handleStyleMeClick(item: LatestItem, cardIndex: number) {
    const tryOnItem: TryOnItem = {
      id: item.id,
      image: item.collectionImage,
      name: item.title,
    };

    const eventOptions = {
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: latestSection.title,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    };

    // Use composable's handler directly (it already has access to influencer ID)
    await composableHandleStyleMeClick(tryOnItem, eventOptions);
  }

  function handleProductCardClick(item: LatestItem, cardIndex: number) {
    // Track product card click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PRODUCT_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: latestSection.title,
      [ANALYTICS_EVENT_KEYS.productId]: item.id,
      [ANALYTICS_EVENT_KEYS.productName]: item.title,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    });
  }
</script>

<section class="latest-section">
  <!-- Header -->
  <div class="section-header">
    <h2 class="section-title">{latestSection.title}</h2>
    <p class="section-subtitle">{latestSection.subtitle}</p>
  </div>

  <!-- Product Cards Row -->
  <div class="products-row">
    <div class="products-scroll" bind:this={productsScroll} onscroll={handleScroll}>
      {#each latestSection.items as item, index (item.id)}
        {@const itemId = item.id}
        {@const isStyleMeDisabled = isButtonDisabled(itemId)}
        <div class="product-card" data-item-id={item.id} data-preload-url={optimizedUrls[item.id]}>
          <TryOnImageContainer
            {item}
            variant="latest"
            onImageLoad={styleMeHandler.handleTryOnImageLoadComplete}
            onOptimizedUrl={(url) => { optimizedUrls[item.id] = url; }}
            linkUrl="/{influencer.slug}/collection"
            sectionName={latestSection.title}
            cardIndex={index}
          />
          <div class="product-info">
            <p class="product-description">
              {item.description}
            </p>
            <a href={item.products[0].redirectUrl} class="product-image-link" onclick={() => handleProductCardClick(item, index)}>
              <div class="product-image">
                <OptimizedImage
                  src={item.products[0].image}
                  alt="Latest Item"
                />
              </div>
            </a>
            {#if item?.products?.[0]}
              <span class="product-brand">
                <p class="product-brand-name">
                  {item.products[0].brand?.name}
                </p>
                <p class="product-brand-price">
                  {item.products[0].price}
                </p>
              </span>
            {/if}
          </div>
          <div class="collection-image-overlay">
            {#if !isStyleMeDisabled}
              <button class="try-on-btn" onclick={() => handleStyleMeClick(item, index)}>
                <StyleMeWhiteIcon />
                Style Me
              </button>
            {/if}
            <button class="ask-button" onclick={() => handleAskClick(item, index)}>
              <ChatIcon class="ask-icon" />
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Pagination Dots -->
  <div class="pagination-dots">
    {#each latestSection.items as item, index (item.id)}
      <button
        class="dot {index === activeIndex ? 'active' : ''}"
        onclick={() => scrollToIndex(index)}
        aria-label="Go to item {index + 1}"
      ></button>
    {/each}
  </div>
</section>

<style>
  .latest-section {
    background: black;
    padding-bottom: 2rem;
  }

  .section-header {
    padding: 1.875rem 1rem 1rem;
    padding-bottom: 1.5625rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .section-title {
    font-family: 'Abril Fatface';
    font-size: 1.5rem;
    font-weight: 400;
    font-style: Regular;
    line-height: 120%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    text-decoration: underline;
    text-underline-offset: 4px;
    color: white;
  }

  .section-subtitle {
    font-size: 1rem;
    font-weight: 500;
    font-style: Medium;
    letter-spacing: 0%;
    text-align: center;
    color: rgba(255, 255, 255, 1);
  }

  .collection-image-overlay {
    display: flex;
    position: absolute;
    bottom: -1.5rem;
    left: 4rem;
    right: 8rem;
    padding: 1rem;
    gap: 1rem;
  }

  .try-on-btn {
    position: relative;
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

  .products-row {
    background: transparent;
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }

  .products-scroll {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    gap: 0;
    -ms-overflow-style: none;
    scrollbar-width: none;
    padding-bottom: 3rem;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    width: 100%;
  }

  .products-scroll::-webkit-scrollbar {
    display: none;
  }

  .product-card {
    flex-shrink: 0;
    text-decoration: none;
    min-width: 100%;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: relative;
    scroll-snap-align: center;
  }

  .product-image-link {
    display: block;
    margin-top: 3.6375rem;
    margin-left: -2.4375rem;
  }

  .product-image {
    width: 8.25rem;
    height: 9.25rem;
    object-fit: cover;
    background: white;
    padding: 1rem;
    box-shadow: 0px 18.73px 30.01px 18.73px rgba(0, 0, 0, 0.61);
  }

  .product-description {
    font-weight: 500;
    font-style: Medium;
    font-size: 0.75rem;
    letter-spacing: 0%;
    max-width: 6.03rem;
    margin-top: 2.625rem;
    margin-left: 1.625rem;
  }

  .product-brand {
    margin-top: auto;
    margin-left: 1.25rem;
  }

  .product-brand-name {
    color: #fff;
    opacity: 0.7;
    font-size: 11.236px;
    font-style: normal;
    font-weight: 500;
    line-height: normal;
    letter-spacing: 2.247px;
    align-self: stretch;
    margin-bottom: 0.05rem;
  }

  .product-brand-price {
    font-weight: 600;
    font-size: 1rem;
    line-height: 100%;
    letter-spacing: 0%;
    color: white;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    height: 100%;
    position: relative;
  }

  .pagination-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    padding-bottom: 0rem;
    margin-top: 0rem;
  }

  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: #424242;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: background-color 0.3s ease;
  }

  .dot.active {
    background-color: white;
    width: 1.25rem;
    border-radius: 1rem;
  }
</style>
