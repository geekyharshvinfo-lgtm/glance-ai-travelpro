<script lang="ts">
  import type { WardrobeSection } from '$lib/types';
  import { openLightbox } from '$lib/stores/lightbox.svelte';

  interface Props {
    wardrobeSection: WardrobeSection;
  }

  let { wardrobeSection }: Props = $props();

  function handleBuy(redirectUrl: string) {
    window.open(redirectUrl, '_blank');
  }
</script>

<section class="section wardrobe">
  <div class="section-header">
    <h2 class="section-title">{wardrobeSection.title}</h2>
    <p class="section-subtitle">{wardrobeSection.subtitle}</p>
  </div>
  <div class="scroll-x">
    {#each wardrobeSection.items.slice(0, 3) as item (item.id)}
      <div class="wardrobe-item">
        <button
          class="item-thumb"
          onclick={() => openLightbox(item.collectionImage, item.title)}
          aria-label="View {item.title} full screen"
        >
          <img
            src={item.collectionImage}
            alt={item.title}
            class="item-img"
            loading="lazy"
          />
        </button>
        <div class="item-info">
          <div class="item-details">
            <p class="item-name">{item.products?.[0]?.name}</p>
            <p class="item-price">{item.products?.[0]?.price}</p>
          </div>
          <button class="buy-btn" onclick={() => handleBuy(item.products?.[0]?.redirectUrl ?? '#')}>
            BUY
          </button>
        </div>
      </div>
    {/each}
  </div>
</section>

<style>
  .section {
    padding-bottom: 1.5rem;
  }

  .wardrobe {
    background: rgba(17,17,17,1);
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
    text-align: center;
    color: white;
    opacity: 0.6;
    text-transform: uppercase;
  }

  .section-subtitle {
    color: #fff;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    opacity: 0.8;
  }

  .scroll-x {
    display: flex;
    gap: 1.25rem;
    padding: 0 1.25rem;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-snap-type: x mandatory;
    scroll-padding-left: 1.25rem;
  }

  .scroll-x::-webkit-scrollbar {
    display: none;
  }

  .wardrobe-item {
    flex: 0 0 9.5rem;
    width: 9.5rem;
    min-width: 0;
    scroll-snap-align: start;
  }

  .item-thumb {
    position: relative;
    width: 100%;
    aspect-ratio: 9.5 / 14.375;
    overflow: hidden;
    display: block;
    padding: 0;
    margin: 0;
    border: none;
    background: none;
    cursor: zoom-in;
  }

  .item-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .item-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 3.5rem;
    padding: 0 0.5rem;
    background: rgba(42,42,42,1);
    border: 1px solid rgba(255,255,255,0.13);
    box-shadow: 0px 0px 6.67px 0px rgba(0,0,0,0.35);
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
  }

  .buy-btn {
    background: white;
    color: black;
    font-size: 0.6875rem;
    font-weight: 600;
    display: flex;
    height: 1.75rem;
    align-items: center;
    justify-content: center;
    text-transform: uppercase;
    padding: 0 0.5rem;
    cursor: pointer;
    border: none;
    flex-shrink: 0;
  }
</style>
