<script lang="ts">
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from "$lib/constants/analytics";
  import { trackEvent } from "$lib/utils/analytics";
import OptimizedImage from "../common/OptimizedImage.svelte";

  interface Product {
    id: string | number;
    redirectUrl: string;
    image: string;
    name: string;
    price: string | number;
    brand: {
      name: string;
    } | null;
  }

  interface Props {
    products: Product[];
  }

  let { products }: Props = $props();

  function handleProductClick(product: Product, cardIndex: number) {
    if (product.redirectUrl) {
      window.open(product.redirectUrl, '_blank');
      // track event
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PRODUCT_CLICK,
        [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.COLLECTION_PAGE,
        [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.COLLECTION_HERO,
        [ANALYTICS_EVENT_KEYS.productId]: product.id,
        [ANALYTICS_EVENT_KEYS.productName]: product.name,
        [ANALYTICS_EVENT_KEYS.cardIndex]: cardIndex,
      });
    }
  }

</script>

<div class="hero-products">
  {#each products as product, index (product.id)}
    <button
      class="product-card"
      onclick={() => handleProductClick(product, index)}
    >
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

<style>
  .hero-products {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.75rem;
    margin-top: -2rem;
    padding: 0 1rem;
    z-index: 10;
    position: relative;
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
    object-fit: cover;
    display: block;
  }

  .product-info {
    background: rgba(53, 53, 53, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-items: center;
    padding: 1rem 0.5rem;
    max-width: 7.25rem;
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
    text-align: center;
    width: 100%;
  }

  .product-name {
    font-size: 0.635rem;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
    margin-bottom: 0.625rem;
    width: 5rem;
  }

  .product-price {
    font-size: 0.8125rem;
    color: white;
    font-weight: 600;
  }
</style>
