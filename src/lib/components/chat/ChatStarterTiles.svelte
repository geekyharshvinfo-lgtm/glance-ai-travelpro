<script lang="ts">
  import type { StarterTile } from '$lib/types/influencer';
  import {
    StarterCompleteMyLookIcon,
    StarterDressForOccasionIcon,
    StarterWardrobeIcon,
    StarterFunkCollectionIcon,
    StarterWardrobeIconMale,
    StarterDressForOccasionIconMale,
    StarterFunkCollectionIconMale,
    StarterCompleteMyLookIconMale,
  } from '../icons';
  import type { Component } from 'svelte';

  interface Props {
    tiles: StarterTile[];
    onSelect: (tile: StarterTile) => void;
    gender?: string;
  }

  let { tiles, onSelect, gender }: Props = $props();

  const femaleIconMap: Record<string, Component> = {
    wardrobe: StarterWardrobeIcon,
    dressForOccasion: StarterDressForOccasionIcon,
    funkCollection: StarterFunkCollectionIcon,
    completeMyLook: StarterCompleteMyLookIcon,
  };

  const maleIconMap: Record<string, Component> = {
    wardrobe: StarterWardrobeIconMale,
    dressForOccasion: StarterDressForOccasionIconMale,
    funkCollection: StarterFunkCollectionIconMale,
    completeMyLook: StarterCompleteMyLookIconMale,
  };

  const iconMap = $derived(gender === 'female' ? femaleIconMap : maleIconMap);
</script>

<div class="starter-tiles-container">
  <div class="tiles-grid">
    {#each tiles as tile, index (tile.id)}
      <button
        class="tile"
        style="background: linear-gradient(135deg, {tile.gradient.from} 0%, {tile.gradient
          .to} 100%); animation-delay: {index * 80 + 100}ms;"
        onclick={() => onSelect(tile)}
      >
        <div class="tile-icon">
          {#if iconMap[tile.iconKey]}
            {@const IconComponent = iconMap[tile.iconKey]}
            <IconComponent width={64} height={64} />
          {:else}
            <img src={tile.icon} alt="" loading="lazy" decoding="async" />
          {/if}
        </div>
        <div class="tile-content">
          <h3 class="tile-title">{tile.title}</h3>
          <p class="tile-subtitle">{tile.subtitle}</p>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .starter-tiles-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem;
    padding-bottom: 0;
  }

  .tiles-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    width: 100%;
    max-width: 388px;
  }

  .tile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.875rem;
    border-radius: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.12);
    cursor: pointer;
    min-height: 10.875rem;
    position: relative;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;

    /* Fly-up entrance */
    opacity: 0;
    transform: translateY(40px);
    animation: flyUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .tile:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
  }

  .tile:active {
    transform: translateY(0);
  }

  @keyframes flyUp {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tile-icon {
    width: 4rem;
    height: 4rem;
    margin-bottom: 0.75rem;
  }

  .tile-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .tile-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    margin-top: auto;
  }

  .tile-title {
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.5;
    color: white;
    margin: 0;
    text-align: start;
  }

  .tile-subtitle {
    font-weight: 500;
    font-size: 0.75rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.64);
    margin: 0;
    text-align: start;
  }
</style>
