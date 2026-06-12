<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    body: string;
    isUser: boolean;
    timestamp?: number;
    animate?: boolean;
    onTypingComplete?: () => void;
  }

  let { body, isUser, timestamp, animate = false, onTypingComplete }: Props = $props();

  // For typing animation
  let displayedText = $state<string>('');
  const typingSpeed = 50; // ms per word
  let animationFrameId: number | null = null;

  onMount(() => {
    if (!isUser && animate) {
      animateTyping();
    } else {
      displayedText = body;
      onTypingComplete?.();
    }

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
    };
  });

  function animateTyping() {
    const words = body.split(' ');
    let wordIndex = 0;
    let lastTime = 0;

    function step(timestamp: number) {
      if (timestamp - lastTime >= typingSpeed) {
        wordIndex = Math.min(wordIndex + 1, words.length);
        displayedText = words.slice(0, wordIndex).join(' ');
        lastTime = timestamp;
      }

      if (wordIndex < words.length) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        animationFrameId = null;
        onTypingComplete?.();
      }
    }

    animationFrameId = requestAnimationFrame(step);
  }

  function formatTime(epochMs: number | undefined): string {
    if (!epochMs) return '';
    const date = new Date(epochMs);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
</script>

<div class="text-block" class:user={isUser}>
  <p class="message-text">
    {#if !isUser && animate}
      {displayedText}
    {:else}
      {body}
    {/if}
  </p>
  {#if timestamp}
    <span class="timestamp">{formatTime(timestamp)}</span>
  {/if}
</div>

<style>
  .text-block {
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.4;
    position: relative;
    display: flex;
    flex-direction: column;
    background: rgba(27, 27, 27, 1);
    padding: 0.75rem;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border-bottom-right-radius: 12px;
    border-bottom-left-radius: 4px;
  }

  .text-block.user {
    border: 0.5px solid transparent;
    background:
      linear-gradient(rgba(27, 27, 27, 1), rgba(27, 27, 27, 1)) padding-box,
      linear-gradient(91.09deg, rgba(117, 11, 255, 0.2) 0%, rgba(216, 36, 195, 0.2) 100%) border-box;
    color: white;
    padding: 0.5rem 1rem;
    padding-bottom: 1.25rem;
    max-width: 17.75rem;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border-bottom-right-radius: 4px;
    border-bottom-left-radius: 12px;
  }

  .text-block:not(.user) {
    color: #fff;
    padding-bottom: 1rem;
    max-width: 20rem;
  }

  .message-text {
    margin: 0;
  }

  .timestamp {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.64);
    font-weight: 500;
    align-self: flex-end;
    margin-top: 0.5rem;
  }
</style>
