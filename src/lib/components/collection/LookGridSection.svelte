<script lang="ts">
  import type { SelectedForYouSection } from '$lib/types';
  import StyleMeWhiteIcon from '../icons/StyleMeWhiteIcon.svelte';
  import TryOnImageContainer from '../common/TryOnImageContainer.svelte';
  import { useTryOn } from '$lib/composables/useTryOn.svelte';
  import type { TryOnItem } from '$lib/utils/tryOnUtil';
  import type { LookGridItem, LookGridSection, ProductGridSection, WardrobeItem } from '$lib/types/influencer';
  import { ChatIcon } from '../icons';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { goto } from '$app/navigation';
  import { trackEvent } from '$lib/utils/analytics';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import OptimizedImage from '../common/OptimizedImage.svelte';
  import { handleChatMessageSend } from '$lib/utils/chat';

  interface Props {
    section?: SelectedForYouSection;
    homeSection?: LookGridSection | ProductGridSection; // Accept both grid types
    influencerId?: string;
    showChatButton?: boolean; // Optional prop to control visibility of chat button
    isFromViewAll?: boolean; // Optional prop to indicate if this is rendered from a "View All" click
  }

  let { section, influencerId, homeSection, showChatButton, isFromViewAll }: Props = $props();

  let renderedSection = $derived(() => {
    if (!homeSection) return section;

    const itemsToShow = isFromViewAll
      ? homeSection.items
      : homeSection.items.slice(0, 6); // Show only first 6 items on homepage for look-grid section

    const getMappedData = (item: any) => {
      const firstProduct = item.products?.[0];

      return {
        id: item.id,
        name: firstProduct?.name || '',
        price: firstProduct?.price || '',
        ai_look: item.ai_look || null,
        lookImage: item.collectionImage,
        productImage: firstProduct?.image || '',
        productRedirectUrl: firstProduct?.redirectUrl || '',
      };
    };

    let products;

    if (homeSection.type === 'look_grid') {
      products = (itemsToShow as LookGridItem[]).map(getMappedData);
    } else {
      products = (itemsToShow as WardrobeItem[]).map(getMappedData);
    }

    return {
      type: 'selected_for_you',
      title: homeSection.title,
      subtitle: homeSection.subtitle,
      products,
    } as SelectedForYouSection;
  });

  let sectionData = $derived(renderedSection());

  // Initialize try-on composable
  const styleMeHandler = $derived(useTryOn(influencerId));

  const isButtonDisabled = $derived(styleMeHandler.isButtonDisabled);
  const composableHandleStyleMeClick = $derived(styleMeHandler.handleStyleMeClick);
  const handleTryOnImageLoadComplete = $derived(styleMeHandler.handleTryOnImageLoadComplete);

  // Handle Style Me button click
  async function handleStyleMeClick(item: SelectedForYouSection['products'][number], event: Event, cardIndex: number) {
    event.preventDefault();
    event.stopPropagation();

    const tryOnItem: TryOnItem = {
      id: item.id,
      image: item.lookImage,
      name: item.name,
    };

    const eventOptions = {
      [ANALYTICS_EVENT_KEYS.pageName]: (isFromViewAll || section) ? PAGE_NAMES.COLLECTION_PAGE : PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: sectionData?.title,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    };
    
    // Pass analytics options to composable
    await composableHandleStyleMeClick(tryOnItem, eventOptions);
  }

  function handleAskClick(product: SelectedForYouSection['products'][number], event: Event, cardIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    
    // Track Ask button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.ASK_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: (isFromViewAll || section) ? PAGE_NAMES.COLLECTION_PAGE : PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: sectionData?.title,
      [ANALYTICS_EVENT_KEYS.productId]: product.id,
      [ANALYTICS_EVENT_KEYS.productName]: product.name,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    });

    handleChatMessageSend('Find me something similar', { url: product.lookImage });
    goto(`/${influencerId}/chat`);
  }

  function handleProductCardClick(product: SelectedForYouSection['products'][number], cardIndex: number) {
    // Track product card click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PRODUCT_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: (isFromViewAll || section) ? PAGE_NAMES.COLLECTION_PAGE : PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: sectionData?.title,
      [ANALYTICS_EVENT_KEYS.productId]: product.id,
      [ANALYTICS_EVENT_KEYS.productName]: product.name,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    });
  }
</script>

<div class="selected-for-you-section {homeSection ? 'home-section' : ''} {isFromViewAll ? 'from-view-all' : ''}">
  <div class="section-header {homeSection ? 'home-section-header' : ''}">
    <h2 class="section-title">{sectionData?.title}</h2>
    <p class="section-subtitle">{sectionData?.subtitle}</p>
  </div>
  <div class="products-grid">
    {#each sectionData?.products as product, index (product.id)}
      {@const itemId = product.id}
      {@const isStyleMeDisabled = !!product.ai_look || isButtonDisabled(itemId)}

      <a
        href={product.productRedirectUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="product-card"
        data-item-id={product.id}
        onclick={() => handleProductCardClick(product, index)}
      >
        <div class="look-image-container">
          <TryOnImageContainer
            item={product}
            variant="collection-product-card"
            onImageLoad={handleTryOnImageLoadComplete}
            sectionName={sectionData?.title}
            pageName={isFromViewAll ? PAGE_NAMES.COLLECTION_PAGE : PAGE_NAMES.HOME_PAGE}
          />

          <div class="action-buttons">
            {#if !isStyleMeDisabled}
              <button class="style-me-btn" onclick={(event) => handleStyleMeClick(product, event, index)}>
                <StyleMeWhiteIcon width="0.75rem" height="0.75rem" />
              </button>
            {/if}
            {#if showChatButton}
              <button class="ask-button" onclick={(event) => handleAskClick(product, event, index)}>
                <ChatIcon width="0.75rem" height="0.75rem" />
              </button>
            {/if}
          </div>
        </div>
        

        <div class="product-details">
          <div class="product-image-container">
            <div class=product-image>
              <OptimizedImage
                src={product.productImage}
                alt={product.name}
              />
            </div>
          </div>
          <div class="product-info">
            <p class="product-name">{product.name}</p>
            <p class="product-price">{product.price}</p>
          </div>

          
        </div>
      </a>
    {/each}
  </div>
</div>

<style>
  .selected-for-you-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0 1rem;
    box-sizing: border-box;
  }

  .selected-for-you-section.home-section {
    background: rgba(29, 29, 29, 1);
    margin-top: 32px;
    padding-bottom: 32px;
  }

  .selected-for-you-section.from-view-all {
    margin-top: 0;
  }

  .section-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1rem;
  }

  .section-header.home-section-header {
    margin-top: 2rem;
    margin-bottom: 0;
  }

  .section-title {
    font-family: 'Playfair Display';
    font-weight: 500;
    font-size: 1.375rem;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
  }

  .section-subtitle {
    font-weight: 400;
    font-size: 0.8125rem;
    line-height: 1.125rem;
    text-align: center;
    color: white;
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    width: 100%;
    margin-top: 2rem;
  }

  .product-card {
    background: rgba(53, 53, 53, 1);
    border: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    flex-direction: column;
    position: relative;
    text-decoration: none;
  }

  .look-image-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  .action-buttons {
    position: absolute;
    bottom: 0.5rem;
    left: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .style-me-btn {
    display: flex;
    width: 2rem;
    height: 2rem;
    justify-content: center;
    align-items: center;
    gap: 16px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.21);
    background: linear-gradient(94deg, #111 0%, #424242 98.94%);
    border: none;
    cursor: pointer;
    z-index: 10;
  }

  .ask-button {
    height: 2rem;
    width: 2rem;
    border-radius: 50%;
    background: linear-gradient(94.33deg, #111111 0%, #424242 98.94%);
    border: 1px solid rgba(255, 255, 255, 0.21);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .product-details {
    display: flex;
    padding: 0.5rem;
    gap: 0.5rem;
    align-items: center;
  }

  .product-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    width: 1rem;
    gap: 1rem;
  }

  .product-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #FFF;
    font-size: 11px;
    font-style: normal;
    font-weight: 500;
    line-height: 9px; /* 81.818% */
  }

  .product-price {
    color: #FFF;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: 9px; /* 75% */
  }

  .product-image-container {
    width: 3.5rem;
    height: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 5.333px;
    background: #FFF;
    box-shadow: 0 0 6.667px 0 rgba(0, 0, 0, 0.35);
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
  }
</style>
