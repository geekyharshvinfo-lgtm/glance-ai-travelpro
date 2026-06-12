<script lang="ts">
  import type { StarterItem } from '$lib/types';

  interface Props {
    content: StarterItem[];
    onSelect: (selection: string, id: string) => void;
    disabled?: boolean;
  }

  let { content, onSelect, disabled = false }: Props = $props();

  function handleClick(item: StarterItem) {
    if (!disabled) {
      onSelect(item.message, item.id);
    }
  }
</script>

<div class="starter-container">
  {#each content as item (item.id)}
    <button
      class="starter-button"
      class:style-me={item.type === 'STYLE_ME'}
      class:create-look={item.type === 'CREATE_LOOK'}
      onclick={() => handleClick(item)}
      {disabled}
    >
      <span class="starter-icon">
        {#if item.type === 'STYLE_ME'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M20.38 3.46L16 2l-4 3.99L7.62 2.71l-3.25 3.25 3.27 4.38L4 14l1.46 4.38 4.38-1.45 3.99 4 4.38-3.99-.95-3.57 4.01-4.01-4.01-1.43.12-4.47z"
            />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        {/if}
      </span>
      <span class="starter-text">{item.message}</span>
    </button>
  {/each}
</div>

<style>
  .starter-container {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE as well */
  }

  .starter-container::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  .starter-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 2rem;
    color: #fff;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(27, 27, 27, 1);
    height: 1.75rem;
    padding: 0 1rem;
  }

  .starter-button:hover:not(:disabled) {
    background: #750bff;
    color: white;
  }

  .starter-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .starter-icon {
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .starter-icon svg {
    width: 100%;
    height: 100%;
  }

  .starter-text {
    line-height: 1;
  }
</style>
