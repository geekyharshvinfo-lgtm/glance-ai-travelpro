<script lang="ts">
  import type { Snippet } from 'svelte';
  import CrossIcon from '../icons/CrossIcon.svelte';
  import CloseIcon from '../icons/CloseIcon.svelte';

  interface Props {
    isOpen: boolean;
    showCloseIcon?: boolean;
    onClose: () => void;
    children: Snippet;
  }

  let { isOpen, showCloseIcon = true, onClose, children }: Props = $props();

  let startY = 0;
  let currentY = 0;
  let dragging = false;
  let sheetEl = $state<HTMLDivElement | null>(null);

  function handleTouchStart(e: TouchEvent) {
    startY = e.touches[0].clientY;
    dragging = true;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!dragging) return;

    currentY = e.touches[0].clientY;
    const delta = currentY - startY;

    if (delta > 0 && sheetEl) {
      sheetEl.style.transform = `translateY(${delta}px)`;
    }
  }

  function handleTouchEnd() {
    dragging = false;

    const delta = currentY - startY;

    if (delta > 120) {
      onClose();
    } else if (sheetEl) {
      sheetEl.style.transform = 'translateY(0)';
    }
  }
</script>

{#if isOpen}
  <div
    class="bottomsheet-overlay"
    onclick={onClose}
    tabindex="0"
    role="button"
    onkeydown={(e) => e.key === 'Enter' && onClose()}
  >
    <div
      class="bottomsheet"
      onclick={(e) => e.stopPropagation()}
      tabindex="0"
      role="dialog"
      onkeydown={(e) => e.key === 'Escape' && onClose()}
      ontouchstart={handleTouchStart}
      ontouchmove={handleTouchMove}
      ontouchend={handleTouchEnd}
      bind:this={sheetEl}
    >
      <div class="ellipse-container">
        <svg
          width="250.633"
          height="80.111"
          viewBox="0 0 250.633 80.111"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          class="ellipse-svg"
        >
          <ellipse cx="125.317" cy="40.055" rx="125.317" ry="40.055" fill="rgba(217,217,217,0.5)" />
        </svg>
      </div>
      <div class="divider"></div>
      {#if showCloseIcon}
        <button class="close-icon" onclick={onClose} aria-label="Close">
          <CloseIcon width={24} height={24} />
        </button>
      {/if}
      
      <!-- Slot for dynamic content -->
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .bottomsheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }

  .ellipse-container {
    width: 100%;
    display: flex;
    justify-content: center;
    position: absolute;
    top: -40px;
    left: 0;
    right: 0;
    z-index: 1200;
    pointer-events: none;
  }

  .ellipse-svg {
    filter: blur(57.22px);
    width: 250.633px;
    height: 80.111px;
    margin: 0 auto;
    display: block;
  }

  .divider {
    width: 20%;
    height: 1px;
    min-height: 1px;
    margin: -20px auto 20px auto;
    align-self: center;
    border-radius: 2.289px;
    opacity: 0.2;
    background: #fff;
  }

  .bottomsheet {
    background: #1a1a1a;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 0 32px 0 rgba(0, 0, 0, 0.3);
    padding: 32px 24px 24px 24px;
    color: #fff;
    width: 100%;
    max-width: 412px;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1100;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: transform 0.25s ease;
    will-change: transform;
  }

  .close-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    color: #fff;
  }
</style>
