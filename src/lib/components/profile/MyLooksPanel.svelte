<script lang="ts">
  import ProfileHeader from './ProfileHeader.svelte';
  import DownloadIcon from '../icons/DownloadIcon.svelte';
  import ShareIcon from '../icons/ShareIcon.svelte';
  import { downloadExpandedImage, shareExpandedImage } from '$lib/utils/imageActionHandlers';
  import type { MyLookItem } from '$lib/types/myLooks';
  import { getMyLooks } from '$lib/api/myLooks';
  import { userStore } from '$lib/stores/user.svelte';
  import ExpandedImage from '../common/ExpandedImage.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let looks = $state<MyLookItem[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let expandedImageUrl = $state<string | null>(null);

  async function fetchLooks() {
    try {
      isLoading = true;
      error = null;

      const res = await getMyLooks(userStore.accountId, userStore.profileId, userStore.deviceId);
      looks = res.looks || [];
    } catch (err) {
      console.error(err);
      error = 'Failed to load looks';
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    if (isOpen) {
      fetchLooks();
    }
  });

  function handleImageClick(imageUrl: string) {
    expandedImageUrl = imageUrl;
  }

  function handleLooksClose() {
    onClose?.();
    expandedImageUrl = null;
  }
</script>

{#if isOpen}
  <div class="overlay">
    <div class="panel">
      <ProfileHeader
        onBack={handleLooksClose}
        title="Looks"
        showBackButton={expandedImageUrl === null}
      />
      {#if isLoading}
        <!-- Shimmer Title -->
        <div class="title shimmer-title"></div>
        <div class="grid">
          {#each Array(6) as _, i (i)}
            <div class="card">
              <div class="looks-image-wrapper shimmer-card"></div>
            </div>
          {/each}
        </div>
      {:else if error}
        <div class="error">Failed to load looks</div>
      {:else}
        <!-- Title -->
        <div class="title">YOUR GENERATED LOOKS</div>
        <!-- Empty State -->
        {#if looks.length === 0}
          <div class="empty-state">
            <p class="empty-title">No looks yet 👀</p>
            <p class="empty-subtitle">Start exploring and generate your first look</p>
          </div>
        {:else}
          <!-- Grid -->
          <div class="grid">
            {#each looks as item, index (index)}
              <div class="card">
                <div class="looks-image-wrapper">
                  <button
                    class="image-click-wrapper"
                    onclick={() => handleImageClick(item.imageUrl)}
                    aria-label="View full image"
                  >
                    <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
                  </button>

                  <div class="image-actions">
                    <button
                      class="image-action-btn"
                      aria-label="Download"
                      onclick={(e) => downloadExpandedImage(e, item.imageUrl)}
                    >
                      <DownloadIcon />
                    </button>
                    <button
                      class="image-action-btn"
                      aria-label="Share"
                      onclick={(e) => shareExpandedImage(e, item.imageUrl)}
                    >
                      <ShareIcon />
                    </button>
                  </div>
                </div>
                <!-- Product info overlay , uncomment when we have to show product info -->
                <!-- <div class="product">
                  <div class="product-image">
                    <img src={item.productImage} />
                  </div>
              
                  <div class="product-details">
                    <div class="product-details-title">{item.title}</div>
                    <span class="product-details-price">{item.price}</span>
                  </div>
                </div> -->
              </div>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
  {#if expandedImageUrl}
    <ExpandedImage {expandedImageUrl} closeExpandedImage={() => (expandedImageUrl = null)} />
  {/if}
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1235;
  }

  .panel {
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    max-width: 420px;
    height: 100%;
    background: #111;
    overflow-y: auto;
  }

  .title {
    margin-bottom: 1rem;
    color: #fff;
    text-align: center;
    font-family: 'Playfair Display';
    font-size: 22px;
    font-style: normal;
    font-weight: 600;
    line-height: 22px; /* 100% */
    text-transform: uppercase;
  }

  .shimmer-card {
    width: 100%;
    height: 20rem;
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 37%, #2a2a2a 63%);
    background-size: 400% 100%;
    animation: shimmer 2s ease infinite;
  }
  .shimmer-title {
    margin-left: 2.6rem;
    width: 80%;
    height: 2rem;
    background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 37%, #2a2a2a 63%);
    background-size: 400% 100%;
    animation: shimmer 2s ease infinite;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    padding: 1rem;
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .looks-image-wrapper {
    position: relative;
    width: 100%;
    height: 20rem;
    overflow: hidden;
  }

  .card img {
    width: 100%;
  }

  .error {
    color: red;
    text-align: center;
    margin-top: 2rem;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    margin-top: 4rem;
    text-align: center;
    gap: 0.5rem;
  }

  .empty-title {
    font-size: 1rem;
    font-weight: 600;
    color: #fff;
  }

  .empty-subtitle {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .image-actions {
    position: absolute;
    top: 2%;
    right: 3%;
    display: flex;
    gap: 0.6rem;
  }

  .image-action-btn {
    width: 2rem;
    height: 2rem;
    padding: 0.5rem;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
