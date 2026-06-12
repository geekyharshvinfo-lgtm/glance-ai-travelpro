<script lang="ts">
  import type { ProductItem } from '$lib/types';

  interface Props {
    product: ProductItem;
  }

  let { product }: Props = $props();

  function handleProductClick(product: ProductItem) {
    if (product?.cta?.url) {
      window.open(product.cta.url, '_blank', 'noopener,noreferrer');
    }
  }
  function toCapitalCase(text: string) {
    return text.charAt(0) + text.slice(1).toLowerCase();
  }
</script>

<button class="similar-product-card" onclick={() => handleProductClick(product)}>
  <div class="image-wrapper">
    <img
      src={product.imageUrl}
      alt={product.brand}
      class="similar-product-image"
      loading="lazy"
      decoding="async"
    />
    <div class="price-badge">
      <div class="price-text">
        {product.price}
      </div>
    </div>
    <!-- Showing Tag only for SIMILAR match type as of now, can be extended to EXACT in future if needed -->
    {#if product.matchType && product.matchType === 'SIMILAR'}
      <div class="similar-tag">
        <div class="similar-text">
          {toCapitalCase(product.matchType)}
        </div>
      </div>
    {/if}
  </div>

  <div class="similar-product-info">
    <span class="similar-product-brand">{product.brand}</span>
    <div class="buy-row">BUY NOW →</div>
  </div>
</button>

<style>
  .similar-product-card {
    width: 5.4rem;
    height: 7.7rem;
    border: none;
    background: #1c1c1f;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
    cursor: pointer;
    padding: 0;
    transition: transform 0.15s ease;
  }

  .similar-product-card:hover {
    transform: translateY(-2px);
  }

  .similar-product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
    display: block;
  }

  .similar-product-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 6px 8px;
    min-width: 0;
  }

  .similar-product-brand {
    overflow: hidden;
    color: #fff;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 8px;
    font-style: normal;
    font-weight: 500;
    line-height: 12px; /* 150% */
    width: 100%;
    text-align: left;
  }

  .image-wrapper {
    position: relative;
    height: 85px;
  }

  .price-badge {
    display: flex;
    padding: 4px 6px;
    justify-content: center;
    align-items: center;
    gap: 11.5px;
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.6);
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 12px;
    backdrop-filter: blur(4px);
  }

  .similar-tag {
    position: absolute;
    top: 3px;
    right: 3px;
    font-size: 12px;
    display: inline-flex;
    height: 12px;
    padding: 4px;
    justify-content: center;
    align-items: center;
    gap: 10px;
    border-radius: 20px;
    border: 0.6px solid #750bff;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(6.5px);
  }

  .similar-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #000;
    font-size: 8px;
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0.16px;
  }

  .price-text {
    overflow: hidden;
    color: #fff;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px;
    font-style: normal;
    font-weight: 500;
    line-height: 8px; /* 80% */
  }

  .buy-row {
    color: #fff;
    font-size: 8px;
    font-style: normal;
    font-weight: 700;
    line-height: 12.585px; /* 157.317% */
  }
</style>
