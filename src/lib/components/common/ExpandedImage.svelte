<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { CloseIcon, DownloadIcon, ShareIcon } from '../icons';
  import { cubicOut } from 'svelte/easing';
  import { downloadExpandedImage, shareExpandedImage } from '$lib/utils/imageActionHandlers';

  interface Props {
    expandedImageUrl?: string;
    closeExpandedImage: () => void;
  }

  let { expandedImageUrl, closeExpandedImage }: Props = $props();
</script>

{#if expandedImageUrl}
  <div
    class="image-popup-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Expanded image view"
    transition:fade={{ duration: 250 }}
  >
    <button
      class="image-popup-close"
      onclick={closeExpandedImage}
      aria-label="Close"
      in:fade={{ duration: 200, delay: 150 }}
    >
      <CloseIcon />
    </button>
    <img
      src={expandedImageUrl}
      alt="Expanded look"
      class="image-popup-img"
      in:scale={{ duration: 300, start: 0.85, easing: cubicOut }}
      out:scale={{ duration: 200, start: 0.85 }}
    />
    <div class="image-popup-actions" role="toolbar" in:fade={{ duration: 200, delay: 150 }}>
      <button
        class="image-popup-action-btn"
        aria-label="Download"
        onclick={(e) => downloadExpandedImage(e, expandedImageUrl)}
      >
        <DownloadIcon />
      </button>
      <button
        class="image-popup-action-btn"
        aria-label="Share"
        onclick={(e) => shareExpandedImage(e, expandedImageUrl)}
      >
        <ShareIcon />
      </button>
    </div>
  </div>
{/if}

<style>
  /* Image popup overlay — fills space between header and input */
  .image-popup-overlay {
    position: fixed;
    top: 3.5rem; /* header height */
    left: 0;
    right: 0;
    bottom: 0;
    background: #111;
    z-index: 1250;
    padding: 1rem;
  }

  .image-popup-close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    width: 2.25rem;
    height: 2.25rem;
    background: rgba(0, 0, 0, 0.8);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1;
  }

  .image-popup-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 0.75rem;
  }

  .image-popup-actions {
    position: absolute;
    bottom: 12%;
    left: 50%;
    transform: translate(-50%, 12%);
    display: flex;
    gap: 1rem;
  }

  .image-popup-action-btn {
    width: 2.5rem;
    padding: 0.625rem;
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
