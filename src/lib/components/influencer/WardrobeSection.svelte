<script lang="ts">
  import type { WardrobeSection } from '$lib/types';
  import TryOnImageContainer from '$lib/components/common/TryOnImageContainer.svelte';
  import { useTryOn } from '$lib/composables/useTryOn.svelte';
  import StyleMeWhiteIcon from '../icons/StyleMeWhiteIcon.svelte';
  import type { TryOnItem } from '$lib/utils/tryOnUtil';
  import ArrowIcon from '../icons/ArrowIcon.svelte';
  import { ChatIcon } from '../icons';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { goto } from '$app/navigation';
  import { openCollectionDrawer } from '$lib/stores/collectionDrawer.svelte';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import { trackEvent } from '$lib/utils/analytics';
  import { handleChatMessageSend } from '$lib/utils/chat';


  interface WardrobeSectionProps {
    wardrobeSection: WardrobeSection;
    influencerId?: string;
    influencerSlug?: string;
  }

  let { wardrobeSection, influencerId, influencerSlug }: WardrobeSectionProps = $props();

  // Initialize try-on composable
  const styleMeHandler = $derived(useTryOn(influencerId));

  const isButtonDisabled = $derived(styleMeHandler.isButtonDisabled);
  const composableHandleStyleMeClick = $derived(styleMeHandler.handleStyleMeClick);

  async function handleStyleMeClick(item: WardrobeSection['items'][number], cardIndex: number) {
    const tryOnItem: TryOnItem = {
      id: item.id,
      image: item.collectionImage,
      name: item.title,
    };

    const eventOptions = {
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: wardrobeSection.title,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    };

    // Use composable's handler directly
    await composableHandleStyleMeClick(tryOnItem, eventOptions);
  }

  function handleAskClick(collection: WardrobeSection['items'][number], cardIndex: number) {
    // Track Ask button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.ASK_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: wardrobeSection.title,
      [ANALYTICS_EVENT_KEYS.productId]: collection.id,
      [ANALYTICS_EVENT_KEYS.productName]: collection.title,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    });

    handleChatMessageSend('Find me something similar', { url: collection.collectionImage });
    goto(`/${influencerId}/chat`);
  }

  function handleViewAllClick() {
    // Track ViewAll button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.VIEW_ALL_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: wardrobeSection.title,
      [ANALYTICS_EVENT_KEYS.sectionOrder]: wardrobeSection.priority
    });

    // Open drawer - it will handle the API call and show shimmer while loading
    openCollectionDrawer({
      mode: 'productGrid',
      sectionId: wardrobeSection.id,
      influencerSlug: influencerSlug,
      collectionLoading: true, // Start in loading state
      gridData: null, // Start with null to show shimmer
    });
  }

  function handleBuyButtonClick(item: WardrobeSection['items'][number], cardIndex: number) {

    window.open(item.products?.[0]?.redirectUrl, '_blank');

    // Track Buy button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.BUY_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: wardrobeSection.title,
      [ANALYTICS_EVENT_KEYS.productId]: item.products?.[0]?.id,
      [ANALYTICS_EVENT_KEYS.productName]: item.products?.[0]?.name,
      [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
    });
  }
</script>

<section class="section wardrobe">
  <div class="section-header">
    <h2 class="section-title">{wardrobeSection.title}</h2>
    <p class="section-subtitle">{wardrobeSection.subtitle}</p>
  </div>
  <div class="scroll-x">
    {#each wardrobeSection.items.slice(0,5) as item, index (item.id)}
      {@const itemId = item.id}
      {@const itemIsDisabled = isButtonDisabled(itemId)}
      <div class="wardrobe-item" data-item-id={item.id}>
        <div class="item-thumb">
          <TryOnImageContainer
            {item}
            variant="wardrobe"
            onImageLoad={styleMeHandler.handleTryOnImageLoadComplete}
          />

          <div class="action-buttons">
            {#if !itemIsDisabled}
              <button class="style-me-btn" onclick={() => handleStyleMeClick(item, index)}>
                <StyleMeWhiteIcon width="0.75rem" height="0.75rem" />
              </button>
            {/if}
            <button class="ask-button" onclick={() => handleAskClick(item, index)}>
              <ChatIcon width="0.75rem" height="0.75rem" />
            </button>
          </div>
        </div>
        <div class="item-info">
          <div class="item-details">
            <p class="item-name">{item.products?.[0]?.name}</p>
            <p class="item-price">{item.products?.[0]?.price}</p>
          </div>
          <button class="buy-btn" onclick={() => handleBuyButtonClick(item, index)}>
            BUY
          </button>
        </div>
      </div>
    {/each}
  </div>
  {#if wardrobeSection.viewAll}
    <button class="view-all-btn" onclick={handleViewAllClick}>
      View All
      <ArrowIcon />
    </button>
  {/if}
</section>

<style>
  .section {
    padding-bottom: 1.5rem;
  }

  .wardrobe {
    background: rgba(17, 17, 17, 1);
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .section-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    padding: 1.5rem 1.5rem 0 1.5rem;
  }

  .section-title {
    font-family: 'Playfair Display';
    font-weight: 400;
    font-size: 1.5rem;
    line-height: 120%;
    letter-spacing: 0%;
    text-align: center;
    color: white;
    opacity: 0.6;
    text-transform: uppercase;
  }

  .section-subtitle {
    color: #FFF;
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 16px; /* 133.333% */
    opacity: 0.8;
  }

  .scroll-x {
    display: flex;
    overflow-x: auto;
    gap: 1rem;
    -ms-overflow-style: none;
    scrollbar-width: none;
    padding: 0 1rem;
  }

  .scroll-x::-webkit-scrollbar {
    display: none;
  }

  .wardrobe-item {
    flex-shrink: 0;
    width: 9.5rem;
  }

  .item-thumb {
    position: relative;
    width: 9.5rem;
    height: 14.375rem;
    overflow: hidden;
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
    color: #fff;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.21);
    background: linear-gradient(94deg, #111 0%, #424242 98.94%);
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

  .item-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 3.5rem;
    padding: 0 0.5rem;
    background: rgba(42, 42, 42, 1);
    border: 1px solid rgba(255, 255, 255, 0.13);
    box-shadow: 0px 0px 6.67px 0px rgba(0, 0, 0, 0.35);
  }

  .item-details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.25rem;
    max-width: 5rem;
  }

  .item-name {
    font-size: 0.6875rem;
    font-weight: 500;
    text-align: center;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    
  }

  .item-price {
    font-size: 0.75rem;
    color: white;
    font-weight: 600;
    text-align: center;
  }

  .buy-btn {
    background: white;
    color: black;
    text-align: center;
    font-size: 0.6875rem;
    font-weight: 600;
    display: flex;
    height: 1.75rem;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    text-decoration: none;
    padding: 0 0.5rem;
  }

  .view-all-btn {
    width: 152px;
    height: 40px;
    margin: 0 auto;
    font-size: 0.75rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    text-transform: uppercase;
    color: white;
    display: flex;
    padding: 10px 12px;
    justify-content: center;
    align-items: center;
    gap: 16px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.21);
    background: linear-gradient(94deg, #111 0%, #424242 98.94%);
  }
</style>
