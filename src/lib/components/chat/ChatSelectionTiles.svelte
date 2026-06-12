<script lang="ts">
  import type { TileItem } from '$lib/types';

  interface Props {
    content: TileItem[];
    onSelect: (selection: string, id: string) => void;
    disabled?: boolean;
  }

  let { content, onSelect, disabled = false }: Props = $props();

  function handleClick(item: TileItem) {
    if (!disabled) {
      onSelect(item.text, item.id);
    }
  }
</script>

<div class="tiles-container">
  {#each content as item (item.id)}
    <button class="tile-button" onclick={() => handleClick(item)} {disabled}>
      <div class="tile-image-wrapper">
        <img
          src={item.imageUrl}
          alt={item.text}
          class="tile-image"
          loading="lazy"
          decoding="async"
        />
        {#if item.label}
          <span class="tile-label">{item.label}</span>
        {/if}
      </div>
      <span class="tile-text">{item.text}</span>
    </button>
  {/each}
</div>

<style>
  .tiles-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .tile-button {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0;
    border: 1px solid #333;
    border-radius: 0.75rem;
    background: #2a2a2a;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .tile-button:hover:not(:disabled) {
    border-color: #750bff;
    box-shadow: 0 4px 12px rgba(117, 11, 255, 0.25);
  }

  .tile-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .tile-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 3/4;
    overflow: hidden;
  }

  .tile-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tile-label {
    position: absolute;
    top: 0.5rem;
    left: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 0.25rem;
  }

  .tile-text {
    padding: 0.5rem 0.75rem 0.75rem;
    font-weight: 600;
    font-size: 0.8125rem;
    color: #fff;
    text-align: left;
  }
</style>
