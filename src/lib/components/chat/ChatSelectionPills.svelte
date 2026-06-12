<script lang="ts">
  interface Props {
    content: string[];
    onSelect: (selection: string) => void;
    disabled?: boolean;
    animate?: boolean;
  }

  let { content, onSelect, disabled = false, animate = false }: Props = $props();

  function handleClick(message: string) {
    if (!disabled) {
      onSelect(message);
    }
  }
</script>

<div class="pills-container">
  {#each content as message, index (`${message}-${index}`)}
    <button
      class="pill-button"
      class:animate
      style:animation-delay={animate ? `${index * 60}ms` : '0ms'}
      onclick={() => handleClick(message)}
      {disabled}
    >
      {message}
    </button>
  {/each}
</div>

<style>
  .pills-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 0.75rem;
    padding: 0 1rem;
  }

  .pill-button {
    height: 2.5rem;
    padding: 0 1.2rem;
    border-radius: 1.25rem 1.25rem 1.25rem 0.5rem;
    border: 0.65px solid transparent;
    background:
      linear-gradient(123.86deg, rgba(15, 15, 15) -0.06%, rgba(15, 15, 15) 69.56%) padding-box,
      linear-gradient(
          240.9deg,
          rgba(255, 255, 255, 0.12) 15.86%,
          rgba(255, 255, 255, 0.354) 49.22%,
          rgba(255, 255, 255, 0.084) 87.54%
        )
        border-box;
    color: #fff;
    font: inherit;
    font-weight: 600;
    font-size: 0.875rem;
    text-align: left;
    white-space: nowrap;
  }

  .pill-button:active:not(:disabled) {
    background: linear-gradient(158deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.16) 70%);
  }

  .pill-button:disabled {
    opacity: 0.5;
  }

  .pill-button.animate {
    opacity: 0;
    translate: -30% 0;
    animation: slideInLeft 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes slideInLeft {
    to {
      opacity: 1;
      translate: 0 0;
    }
  }
</style>
