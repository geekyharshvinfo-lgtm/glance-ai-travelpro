<script lang="ts">
  import StyleMeWhiteIcon from '../icons/StyleMeWhiteIcon.svelte';
  import TryOnImageContainer from '../common/TryOnImageContainer.svelte';
  import { useTryOn } from '$lib/composables/useTryOn.svelte';
  import { DownloadIcon, ShareArrowIcon } from '../icons';
  import { downloadExpandedImage, shareExpandedImage } from '$lib/utils/imageActionHandlers';
  import { ANALYTICS_EVENT_KEYS, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import { tryOnStore } from '$lib/stores/tryOnStore.svelte';

  interface Props {
    id: string;
    imageUrl: string;
    influencerId?: string;
    isStyleMeDisabled?: boolean; // Optional prop to control button state
  }

  let { id, imageUrl, influencerId, isStyleMeDisabled = false }: Props = $props();

  // Initialize try-on composable
  const styleMeHandler = $derived(useTryOn(influencerId));

  const isButtonDisabled = $derived(styleMeHandler.isButtonDisabled);
  const composableHandleStyleMeClick = $derived(styleMeHandler.handleStyleMeClick);
  const handleTryOnImageLoadComplete = $derived(styleMeHandler.handleTryOnImageLoadComplete);

  // Create hero item structure for try-on - make it reactive to imageUrl changes
  const collectionHeroItem = $derived({
    id: id,
    image: imageUrl,
    name: `${influencerId} Hero Look`, // TODO: need actual product name for better tryon result
  });

  const showDownloadIcon = $derived(isStyleMeDisabled || !!tryOnStore.tryOnResults[collectionHeroItem.id]);

  const eventOptions = {
    [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.COLLECTION_PAGE,
    [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.COLLECTION_HERO,
    [ANALYTICS_EVENT_KEYS.productId]: id,
  };

  // Handle Style Me button click
  async function handleStyleMeClick() {
    
    await composableHandleStyleMeClick(collectionHeroItem, eventOptions);
  }
</script>

<div class="hero-container" data-item-id={id}>
  <TryOnImageContainer
    item={collectionHeroItem}
    variant="collection-hero"
    onImageLoad={handleTryOnImageLoadComplete}
  />
  <!-- Action buttons -->
  <div class="hero-right-actions">
    {#if showDownloadIcon}
      <!-- If Style Me is disabled (e.g., user generated image), show download and share buttons -->
      <button class="action-btn" onclick={(e) => downloadExpandedImage(e, collectionHeroItem.image, eventOptions)}>
        <DownloadIcon stroke="#000" />
      </button>
    {/if}
    <button class="action-btn" onclick={(e) => shareExpandedImage(e, collectionHeroItem.image, eventOptions)}>
      <ShareArrowIcon stroke="#000" />
    </button>
  </div>
  {#if !isStyleMeDisabled && !isButtonDisabled(collectionHeroItem.id)}
    <button class="style-me-btn" onclick={() => handleStyleMeClick()}>
      <StyleMeWhiteIcon width="1rem" height="1rem" />
      STYLE ME
    </button>
  {/if}
</div>

<style>
  .hero-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .hero-right-actions {
    position: absolute;
    right: 1rem;
    bottom: 3.6rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 2;
  }

  .action-btn {
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease;
    border-radius: 36px;
    border: 0.72px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255);
    backdrop-filter: blur(12px);
  }

  .action-btn:hover {
    transform: scale(1.05);
  }

  .style-me-btn {
    position: absolute;
    bottom: 4rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    height: 2.5rem;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-decoration: none;
    background: linear-gradient(94.33deg, #111111 0%, #424242 98.94%);
    border: 1px solid rgba(255, 255, 255, 0.21);
    cursor: pointer;
  }
</style>
