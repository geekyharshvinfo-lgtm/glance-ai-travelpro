<script lang="ts">
  interface Props {
    content: string[];
    onSelect: (selection: string) => void;
    disabled?: boolean;
  }

  let { content, onSelect, disabled = false }: Props = $props();

  function handleClick(message: string) {
    if (!disabled) {
      onSelect(message);
    }
  }
</script>

<div class="cta-container">
  {#each content as message, index (index)}
    <button
      class="cta-button"
      class:primary={index === 0}
      class:secondary={index > 0}
      onclick={() => handleClick(message)}
      {disabled}
    >
      {message}
    </button>
  {/each}
</div>

<style>
  .cta-container {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }

  .cta-button {
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cta-button.primary {
    background: #750bff;
    color: white;
    border: none;
  }

  .cta-button.primary:hover:not(:disabled) {
    background: #8a2fff;
  }

  .cta-button.secondary {
    background: transparent;
    color: #fff;
    border: 1px solid #750bff;
  }

  .cta-button.secondary:hover:not(:disabled) {
    background: rgba(117, 11, 255, 0.2);
  }

  .cta-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
