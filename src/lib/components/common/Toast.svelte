<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  interface ToastProps {
    message: string;
    type?: 'info' | 'success' | 'error' | 'warning';
    duration?: number;
    onClose?: () => void;
  }

  let { message, type = 'info', duration = 3000, onClose }: ToastProps = $props();

  let visible = $state(true);

  onMount(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        visible = false;
      }, duration);

      return () => clearTimeout(timer);
    }
  });

  function handleClose() {
    visible = false;
    onClose?.();
  }

  function handleAnimationEnd() {
    if (!visible) {
      onClose?.();
    }
  }
</script>

{#if visible}
  <div
    class="toast toast-{type}"
    transition:fly={{ y: -100, duration: 300 }}
    onoutroend={handleAnimationEnd}
  >
    <div class="toast-content">
      <span class="toast-message">{message}</span>
      <button class="toast-close" onclick={handleClose} aria-label="Close">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 1L1 13M1 1L13 13"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .toast {
    position: relative;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 99999;
    min-width: 300px;
    max-width: 500px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    animation: slideIn 0.3s ease-out;
  }

  .toast-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    gap: 1rem;
  }

  .toast-message {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.4;
    word-wrap: break-word;
  }

  .toast-close {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: currentColor;
    opacity: 0.7;
  }

  .toast-close:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  /* Dark theme variations */
  .toast-info {
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  .toast-success {
    background: rgba(16, 24, 16, 0.95);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #86efac;
  }

  .toast-error {
    background: rgba(24, 16, 16, 0.95);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
  }

  .toast-warning {
    background: rgba(24, 24, 16, 0.95);
    border: 1px solid rgba(251, 191, 36, 0.3);
    color: #fde047;
  }

  @keyframes slideIn {
    from {
      transform: translate(-50%, -20px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
</style>
