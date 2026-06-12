<script lang="ts">
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import type { HeroProduct } from '$lib/types';
  import { trackEvent } from '$lib/utils/analytics';
  import OptimizedImage from '$lib/components/common/OptimizedImage.svelte';

  interface QuickActionsBarProps {
    products: HeroProduct[];
    productLimit?: number;
  }

  let { products, productLimit = 3 }: QuickActionsBarProps = $props();

  function handleProductClick(product: HeroProduct, cardIndex: number) {
    if (product.redirectUrl) {
      window.open(product.redirectUrl, '_blank');

      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PRODUCT_CLICK,
        [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
        [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.HERO,
        [ANALYTICS_EVENT_KEYS.productId]: product.id,
        [ANALYTICS_EVENT_KEYS.productName]: product.name,
        [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
      });

    }
  }
</script>

<section class="quick-actions">
  <div class="quick-actions-products">
    {#each products.slice(0, productLimit) as product, index (index)}
      <button onclick={() => handleProductClick(product, index)} class="product-card">
        <div class="product-image">
          <OptimizedImage
            src={product.image}
            alt={product.name}
          />
        </div>
        <div class="product-info">
          <p class="product-brand">{product.brand?.name}</p>
          <p class="product-name">{product.name}</p>
          <p class="product-price">{product.price}</p>
        </div>
      </button>
    {/each}
  </div>
</section>

<style>
  .quick-actions {
    position: relative;
    z-index: 10;
    margin-top: 0rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .quick-actions-products {
    display: flex;
    gap: 0.75rem;
    margin-top: -2rem;
    padding: 0 1rem;
  }

  .product-card {
    min-width: 7.2rem;
    overflow: hidden;
    text-decoration: none;
    border: 1.1px solid rgba(255, 255, 255, 0.12);
    background: linear-gradient(27deg, #2A2A2A 40.53%, #4A4A4A 100%);
  }

  .product-image {
    width: 100%;
    height: 6.53rem;
    display: block;
  }

  .product-info {
    padding: 0.375rem 0.5rem;
    background: rgba(53, 53, 53, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-items: center;
    padding: 1rem 0;
  }

  .product-brand {
    font-weight: 700;
    color: white;
    font-size: 0.635rem;
    line-height: 100%;
    letter-spacing: 0%;
    vertical-align: middle;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 6rem;
  }

  .product-name {
    font-size: 0.635rem;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
    max-width: 6rem;
    margin-bottom: 0.625rem;
  }

  .product-price {
    font-size: 0.8125rem;
    color: white;
    font-weight: 600;
  }
</style>
