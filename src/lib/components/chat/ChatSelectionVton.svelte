<script lang="ts">
  import type { VtonItem, MessageTimer } from '$lib/types';
  import { onDestroy, onMount } from 'svelte';
  import {
    getChatVtonRemainingTime,
    addChatVtonTimer,
    removeChatVtonTimer,
  } from '$lib/stores/tryOnStore.svelte';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import {
    markQueueProcessing,
    markQueueCompleted,
    markQueueFailed,
  } from '$lib/stores/chatTryOnQueue.svelte';

  interface Props {
    content: VtonItem[];
    timer?: MessageTimer;
    onSelect: (selection: string, id: string) => void;
    disabled?: boolean;
    messageId: string;
  }

  let { content, timer, onSelect, disabled = false, messageId }: Props = $props();

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let remainingMs = $state(0);
  let expired = $state(false);
  let isResuming = $state(true); // Flag to indicate we're checking for stored value

  // Check if we have a stored timer on mount
  onMount(() => {
    const storedRemaining = getChatVtonRemainingTime(messageId);
    if (storedRemaining > 0) {
      // Resume from stored timer - mark queue as processing
      markQueueProcessing();
      remainingMs = storedRemaining;
      isResuming = false;
      startCountdown();
    } else if (timer && timer.timeMs > 0) {
      // New timer, store it and mark queue as processing (timer has started)
      remainingMs = timer.timeMs;
      markQueueProcessing();
      if (chatStore.messagesPath && chatStore.influencerId) {
        const productName =
          chatStore.lastSelectedProduct?.message ||
          chatStore.lastSelectedProduct?.brand ||
          'product';
        addChatVtonTimer(
          messageId,
          chatStore.influencerId,
          chatStore.messagesPath,
          timer.timeMs,
          timer.text,
          productName
        );
      }
      isResuming = false;
      startCountdown();
    } else {
      isResuming = false;
    }
  });

  function startCountdown() {
    if (intervalId) {
      clearInterval(intervalId);
    }

    expired = false;
    intervalId = setInterval(() => {
      const stored = getChatVtonRemainingTime(messageId);
      if (stored > 0) {
        remainingMs = stored;
      } else {
        remainingMs = Math.max(0, remainingMs - 1000);
      }

      if (remainingMs <= 0) {
        remainingMs = 0;
        expired = true;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        removeChatVtonTimer(messageId);
        // Timer expired without selection - mark as failed to re-enable buttons
        markQueueFailed();
      }
    }, 1000);
  }

  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function handleClick(item: VtonItem) {
    if (!disabled && !expired) {
      onSelect(item.message, item.id);
      // Clear timer when user makes a selection
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      removeChatVtonTimer(messageId);
      // Selection made - mark queue as completed to re-enable buttons
      markQueueCompleted();
    }
  }
</script>

<div class="vton-container">
  {#if timer && !expired && !isResuming}
    <div class="timer-bar">
      <span class="timer-text">{timer.text}</span>
      <span class="timer-countdown">{formatTime(remainingMs)}</span>
    </div>
  {/if}

  {#if expired}
    <div class="expired-message">This try-on session has expired. Please request a new one.</div>
  {:else}
    <div class="vton-grid">
      {#each content as item (item.id)}
        <button
          class="vton-button"
          onclick={() => handleClick(item)}
          disabled={disabled || expired}
        >
          <div class="vton-image-wrapper">
            <img
              src={item.imageUrl}
              alt={item.message}
              class="vton-image"
              loading="lazy"
              decoding="async"
            />
            <div class="vton-overlay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h6v6" />
                <path d="M10 14L21 3" />
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              </svg>
            </div>
          </div>
          <span class="vton-label">{item.message}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .vton-container {
    margin-top: 0.75rem;
  }

  .timer-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(135deg, #2d1f1f 0%, #2d1a20 100%);
    border: 1px solid #5c2d3e;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .timer-text {
    font-size: 0.75rem;
    color: #f87171;
  }

  .timer-countdown {
    font-size: 0.875rem;
    font-weight: 700;
    color: #f87171;
  }

  .expired-message {
    padding: 1rem;
    background: #2a2a2a;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    color: #999;
    text-align: center;
  }

  .vton-grid {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    -webkit-overflow-scrolling: touch;
  }

  .vton-button {
    flex: 0 0 auto;
    width: 120px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0;
    border: 2px solid #333;
    border-radius: 0.75rem;
    background: #2a2a2a;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .vton-button:hover:not(:disabled) {
    border-color: #750bff;
  }

  .vton-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .vton-image-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 3/4;
    overflow: hidden;
  }

  .vton-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .vton-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(117, 11, 255, 0.3);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .vton-button:hover:not(:disabled) .vton-overlay {
    opacity: 1;
  }

  .vton-overlay svg {
    width: 2rem;
    height: 2rem;
    color: white;
  }

  .vton-label {
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #fff;
    text-align: center;
  }
</style>
