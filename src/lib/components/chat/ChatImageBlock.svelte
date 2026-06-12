<script lang="ts">
  import type { ImageItem, MessageActions, ProductItem } from '$lib/types';
  import { ShareIcon, DownloadIcon } from '../icons';
  import { downloadExpandedImage, shareExpandedImage } from '$lib/utils/imageActionHandlers';
  import ChatTryOnSimilarProductCard from './ChatTryOnSimilarProductCard.svelte';

  interface Props {
    content: ImageItem[];
    actions?: MessageActions;
    showActions?: boolean;
    isUser?: boolean;
    hasText?: boolean;
    similarProducts?: ProductItem[];
    onImageClick?: (imageUrl: string) => void;
    animate?: boolean;
    showShine?: boolean;
  }

  let {
    content,
    actions: _actions,
    showActions = false,
    isUser = false,
    hasText = false,
    similarProducts = [],
    onImageClick,
    animate = false,
    showShine = false,
  }: Props = $props();
</script>

<div class="image-block" class:ai={!isUser} class:user={isUser} class:with-text={hasText}>
  {#each content as item (item.id)}
    <div class="image-item">
      <div class="image-layout">
        <div class="image-wrapper" class:shine={showShine}>
          {#if !isUser && onImageClick}
            <button
              class="image-click-wrapper"
              onclick={() => onImageClick?.(item.imageUrl)}
              aria-label="View full image"
            >
              <img
                src={item.imageUrl}
                alt="Generated look"
                class="generated-image clickable"
                loading={isUser ? 'lazy' : 'eager'}
              />
            </button>
          {:else}
            <img
              src={item.imageUrl}
              alt="Generated look"
              class="generated-image"
              loading={isUser ? 'lazy' : 'eager'}
            />
          {/if}
          {#if item.tag}
            <span class="image-tag">{item.tag}</span>
          {/if}
          {#if item.products}
            <div class="product-overlay">
              <img
                src={item.products.imageUrl}
                alt={item.products.brand}
                class="product-thumbnail"
                loading="lazy"
                decoding="async"
              />
              <div class="product-info">
                <span class="product-brand">{item.products.brand}</span>
                <span class="product-price">{item.products.price}</span>
              </div>
            </div>
          {/if}
          {#if showActions}
            <div class="action-buttons">
              <!-- <button class="action-btn" title="Like" onclick={() => (isLiked = !isLiked)}>
                {#if isLiked}
                  <HeartFilledIcon />
                {:else}
                  <HeartEmptyIcon />
                {/if}
              </button> -->
              <button
                class="action-btn"
                title="Download"
                onclick={(e) => downloadExpandedImage(e, item.imageUrl)}
              >
                <DownloadIcon />
              </button>
              <button
                class="action-btn"
                title="Share"
                onclick={(e) => shareExpandedImage(e, item.imageUrl)}
              >
                <ShareIcon />
              </button>
            </div>
          {/if}
        </div>
        {#if similarProducts && similarProducts.length > 0}
          <div class="similar-products-container">
            {#each similarProducts.slice(0, 3) as product, index (product.id)}
              <div class="similar-product-entry" class:animate style={animate ? `animation-delay: ${index * 120}ms` : undefined}>
                <ChatTryOnSimilarProductCard {product} />
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .image-block {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .image-block.user,
  .image-block.with-text {
    margin-bottom: -1.5625rem; /* -25px - overlap with text below */
  }

  .image-block.user.with-text {
    height: 7.75rem;
  }

  .ai.image-block.with-text {
    margin-bottom: 0;
  }

  .image-block.user {
    align-items: flex-end;
    padding-right: 1rem;
  }

  .image-block.ai {
    margin-top: 0.75rem;
  }

  .image-item {
    position: relative;
    display: inline-block;
  }

  .image-wrapper {
    position: relative;
    border-radius: 0.75rem;
    overflow: hidden;
    background: #1a1a1a;
  }

  /* 45° shine sweep for try-on reveal */
  .image-wrapper.shine::after {
    will-change: translate;
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      135deg,
      transparent 46%,
      rgba(255, 255, 255, 0.25) 50%,
      transparent 54%
    );
    translate: -100% -100%;
    animation: shineReveal 600ms ease-out forwards;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes shineReveal {
    to {
      translate: 0% 0%;
    }
  }

  .image-click-wrapper {
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    display: block;
  }

  .generated-image {
    width: 14rem;
    height: auto;
    display: block;
    object-fit: cover;
    border-radius: 0.75rem;
    border: 0.5px solid transparent;
    background:
      linear-gradient(rgba(27, 27, 27, 1), rgba(27, 27, 27, 1)) padding-box,
      linear-gradient(91.09deg, rgba(117, 11, 255, 0.2) 0%, rgba(216, 36, 195, 0.2) 100%) border-box;
  }

  .image-tag {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    padding: 0.25rem 0.75rem;
    background: linear-gradient(135deg, #750bff 0%, #a855f7 100%);
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 1rem;
  }

  .product-overlay {
    position: absolute;
    bottom: 0.75rem;
    left: 0.75rem;
    right: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(42, 42, 42, 0.95);
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .product-thumbnail {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.25rem;
    object-fit: cover;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .product-brand {
    font-size: 0.75rem;
    font-weight: 600;
    color: #fff;
  }

  .product-price {
    font-size: 0.75rem;
    font-weight: 500;
    color: #a855f7;
  }

  .action-buttons {
    position: absolute;
    bottom: 6%;
    right: 1rem; /* outside */
    transform: translateY(6%);

    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-btn {
    width: 2rem;
    height: 2rem;
    padding: 0.375rem;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: #111;
    backdrop-filter: blur(10.666666984558105px);
  }

  .image-block.user .generated-image {
    width: auto;
    height: auto;
    max-height: 7.75rem; /* 124px */
  }

  .generated-image.clickable {
    cursor: pointer;
  }

  .image-layout {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .similar-products-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex-shrink: 0;
  }

  .similar-product-entry.animate {
    opacity: 0;
    translate: 40% 0;
    animation: similar-product-slide-in 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes similar-product-slide-in {
    to {
      opacity: 1;
      translate: 0 0;
    }
  }
</style>
