<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import type { PageData } from './$types';
  import { MESSAGE_TYPE, MESSAGE_STATUS, type ProductItem, type MessageI } from '$lib/types';
  import { starterTiles as fallbackStarterTiles } from '$lib/data/mocks/chatStarterTiles';
  import ChatHeader from '$components/chat/ChatHeader.svelte';
  import ChatHistoryDrawer from '$components/chat/ChatHistoryDrawer.svelte';
  import ChatMessageContainer from '$components/chat/ChatMessageContainer.svelte';
  import ChatTypingIndicator from '$components/chat/ChatTypingIndicator.svelte';
  import ChatInput from '$components/chat/ChatInput.svelte';
  import ChatStarterTiles from '$components/chat/ChatStarterTiles.svelte';
  import Camera from '$lib/components/onboarding/Camera.svelte';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { cameraOverlayStore, closeCameraOverlay } from '$lib/stores/cameraOverlay.svelte';
  import { onMount, tick } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { CloseIcon, DownloadIcon, ShareIcon } from '$lib/components/icons';
  import { downloadExpandedImage, shareExpandedImage } from '$lib/utils/imageActionHandlers';
  import { trackEvent } from '$lib/utils/analytics';
  import {
    ACTION_TYPES,
    ANALYTICS_EVENT_KEYS,
    AnalyticsEventAction,
    EVENT_TYPES,
    PAGE_NAMES,
    PERFORMANCE_EVENT_ACTIONS,
  } from '$lib/constants/analytics';
  import { usePageTracking } from '$lib/composables/usePageTracking.svelte';
  import type { StarterTile } from '$lib/types/influencer';
  import { handleChatMessageSend } from '$lib/utils/chat';
  interface ChatPageProps {
    data: PageData;
  }

  let { data }: ChatPageProps = $props();
  const influencer = $derived(data.influencer);

  let messagesContainer: HTMLDivElement | null = $state(null);
  let expandedImageUrl = $state<string | null>(null);

  // ── Chat view state (single-pass computation) ──
  //
  // Three visual states:
  //   'loading'      → greeting text + skeleton tiles (chat initializing)
  //   'greeting'     → greeting text + starter tiles  (ready, no user messages yet)
  //   'conversation' → message list                   (user has sent at least one message)
  //
  // Also computes: welcomeMessageId, filtered messages, and lastAgentMessageId.

  type ChatViewState = 'loading' | 'greeting' | 'conversation' | 'migrating';

  const chatView = $derived.by(() => {
    const raw = chatStore.messages;

    // Single pass: find welcome message, check for user messages & agent responses
    let welcomeId: string | null = null;
    let seenUserContext = false;
    let hasAgentResponse = false;
    let hasUserMessage = false;

    for (const msg of raw) {
      const isUser = chatStore.isUserMessage(msg);

      if (msg.type === MESSAGE_TYPE.CONTEXT && isUser) {
        seenUserContext = true;
        continue;
      }
      if (seenUserContext && !welcomeId && !isUser) {
        welcomeId = msg.id;
      }
      if (
        !isUser &&
        msg.type !== MESSAGE_TYPE.LOADING &&
        (msg.content.body || msg.content.payload)
      ) {
        hasAgentResponse = true;
      }
      if (isUser && msg.type !== MESSAGE_TYPE.CONTEXT) {
        hasUserMessage = true;
      }

      // All flags resolved — no need to scan remaining messages
      if (welcomeId && hasAgentResponse && hasUserMessage) break;
    }

    // Filter visible messages (remove loading, empty, and welcome message)
    const filtered = raw.filter((msg) => {
      if (msg.type === MESSAGE_TYPE.LOADING) return false;
      if (msg.type === MESSAGE_TYPE.OPTIMISTIC) return true;
      if (msg.status === MESSAGE_STATUS.DRAFT) return true;
      if (msg.type === MESSAGE_TYPE.ADD_IMAGES) return true;
      if (msg.id === welcomeId) return false;

      const hasBody = !!(msg.content.body && msg.content.body.trim().length > 0);
      const hasPayload = msg.content.payload !== null && msg.content.payload !== undefined;
      const hasSuggestions = !!(msg.content.suggestions && msg.content.suggestions.length > 0);
      return hasBody || hasPayload || hasSuggestions;
    });

    // Last agent message ID (pills only show on this one)
    let lastAgentId: string | null = null;
    for (let i = filtered.length - 1; i >= 0; i--) {
      if (!chatStore.isUserMessage(filtered[i])) {
        lastAgentId = filtered[i].id;
        break;
      }
    }

    // Determine view state
    let state: ChatViewState;
    if (chatStore.migrating) {
      state = 'migrating';
    } else if (chatStore.loading) {
      state = 'loading';
    } else if (hasAgentResponse && !hasUserMessage) {
      state = 'greeting';
    } else {
      state = 'conversation';
    }

    return { state, messages: filtered, lastAgentId };
  });

  // ── Animation tracking ──
  // Animations only play for live Firestore updates (new messages arriving in real-time).
  // All messages present at page load or state transition are rendered instantly.

  let animatedIds = new SvelteSet<string>();
  let liveMode = $state(false);
  let spacerHeightPx = $state(600);

  // Reset when messages are cleared (new session)
  $effect(() => {
    if (chatStore.messages.length === 0) {
      animatedIds.clear();
      liveMode = false;
    }
  });

  // Once in conversation state, mark all current messages as already seen,
  // then enable live mode — only messages arriving AFTER this point animate.
  $effect(() => {
    if (chatView.state !== 'conversation') return;
    if (liveMode) return;
    animatedIds.clear();
    for (const msg of chatView.messages) {
      animatedIds.add(msg.id);
    }
    liveMode = true;
  });

  function shouldAnimate(msg: MessageI): boolean {
    return (
      liveMode &&
      !chatStore.isUserMessage(msg) &&
      !animatedIds.has(msg.id) &&
      msg.id === chatView.lastAgentId
    );
  }

  // Pills/payloads are immediately visible unless a live typing animation is in progress
  function shouldShowMessage(msg: MessageI, index: number): boolean {
    if (!liveMode || chatStore.isUserMessage(msg) || animatedIds.has(msg.id)) return true;
    if ((msg.type === MESSAGE_TYPE.TEXT || msg.type === MESSAGE_TYPE.CONTEXT) && msg.content.body) {
      return true;
    }

    // Wait for preceding text animation to complete
    for (let i = index - 1; i >= 0; i--) {
      const prev = chatView.messages[i];
      if (chatStore.isUserMessage(prev)) return true;
      if (
        (prev.type === MESSAGE_TYPE.TEXT || prev.type === MESSAGE_TYPE.CONTEXT) &&
        prev.content.body
      ) {
        return animatedIds.has(prev.id);
      }
    }
    return true;
  }

  function handleTypingComplete(messageId: string) {
    animatedIds.add(messageId);
    chatStore.notifyTypingComplete(messageId);
    // After word animation done, collapse the spacer to exactly what's needed
    if (liveMode) tick().then(() => collapseBottomSpacer());
  }

  async function scrollToUserMessage(msgId: string, smooth: boolean) {
    await tick();
    const el = messagesContainer?.querySelector(`[data-message-id="${msgId}"]`) as HTMLElement | null;
    if (!el || !messagesContainer) return;

    const targetScrollTop = el.offsetTop - 5;
    // Compute exact spacer needed — no more, no less
    const contentHeight = messagesContainer.scrollHeight - spacerHeightPx;
    spacerHeightPx = Math.max(16, targetScrollTop + messagesContainer.clientHeight - contentHeight);

    await tick(); // wait for spacer DOM update
    messagesContainer.scrollTo({ top: targetScrollTop, behavior: smooth ? 'smooth' : 'instant' });
  }

  function collapseBottomSpacer() {
    if (!messagesContainer) return;
    const scrollTop = messagesContainer.scrollTop;
    const contentHeight = messagesContainer.scrollHeight - spacerHeightPx;
    spacerHeightPx = Math.max(16, scrollTop + messagesContainer.clientHeight - contentHeight);
  }

  // ── Lifecycle ──

  onMount(() => {
    // Track chat page view event
    // trackEvent(AnalyticsEventAction.RENDERED, {
    //   [ANALYTICS_EVENT_KEYS.action]: PERFORMANCE_EVENT_ACTIONS.CHAT_OPENED,
    //   [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PERFORMANCE,
    //   [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.CHAT_PAGE
    // });

    // Track page lifecycle (session tracking)
    usePageTracking({
      pageName: PAGE_NAMES.CHAT_PAGE,
      metadata: {
        influencerId: influencer.id,
        influencerSlug: influencer.slug,
      },
    });

    chatStore.init(influencer.id);
  });

  // Scroll to the latest user message, positioning it 100px from the top of the viewport.
  // On initial load, scrolls to the last user message. In live mode, scrolls on each new user message.
  let lastScrolledUserMsgId: string | null = null;
  let initialScrollDone = false;

  $effect(() => {
    if (chatView.state !== 'conversation') return;
    const msgs = chatView.messages;

    // Find the last user message
    let lastUserMsgId: string | null = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (chatStore.isUserMessage(msgs[i])) {
        lastUserMsgId = msgs[i].id;
        break;
      }
    }

    if (!lastUserMsgId || lastUserMsgId === lastScrolledUserMsgId) return;
    const smooth = initialScrollDone;
    lastScrolledUserMsgId = lastUserMsgId;
    initialScrollDone = true;

    scrollToUserMessage(lastUserMsgId, smooth);
  });

  // ── Greeting animation ──
  // Letters slide up from below into position one by one (staggered CSS animation).
  // Title fades up after all letters have landed.
  const greetingText = $derived((influencer as { chatGreeting?: string }).chatGreeting || "Yo, what's up");
  const greetingChars = $derived(greetingText.split(''));
  const greetingTitle = $derived((influencer as { chatTitle?: string }).chatTitle || "What vibe we tryna serve?");
  const letterDelay = 50; // ms between each letter
  let greetingAnimStarted = $state(false);

  $effect(() => {
    if (chatView.state === 'conversation') return;
    if (greetingAnimStarted) return;
    greetingAnimStarted = true;
  });

  function handleSelection(selection: string, _id?: string) {
    chatStore.clearInputPreview();
    chatStore.sendMessage(selection);
  }

  function handleProductClick(product: ProductItem) {
    if (product.cta.url) {
      window.open(product.cta.url, '_blank', 'noopener,noreferrer');
    }
  }

  function handleImageClick(imageUrl: string) {
    expandedImageUrl = imageUrl;
  }

  function closeExpandedImage() {
    expandedImageUrl = null;
  }

  function handleChatStarterTileClick(tile: StarterTile) {
    chatStore.clearInputPreview();
    chatStore.sendMessage(tile.action);

    // Track chat starter tile click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.CHAT_MESSAGE_SENT,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.CHAT_STARTER_TILE_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.CHAT_PAGE,
      [ANALYTICS_EVENT_KEYS.message]: tile.title,
    });
  }

  function startNewChat() {
    chatStore.clearConversationCache(influencer.id);
    chatStore.fullReset();
    chatStore.init(influencer.id);
  }
</script>

{#snippet ageDisclaimer()}
  <p class="age-disclaimer">
    This chatbot is intended for <strong>above 18</strong> users only.
  </p>
{/snippet}

<svelte:head>
  <title>Chat with {influencer.name} | AI Influencer</title>
</svelte:head>

<div class="chat-container">
  <ChatHeader {influencer} startNewChat={startNewChat} />

  <div class="messages-container" bind:this={messagesContainer}>
    {#if chatStore.error}
      <div class="error-state">
        <div class="error-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="rgba(138, 109, 255, 0.5)" stroke-width="1.5" />
            <path
              d="M12 8v4"
              stroke="rgba(138, 109, 255, 0.8)"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <circle cx="12" cy="16" r="0.75" fill="rgba(138, 109, 255, 0.8)" />
          </svg>
        </div>
        <p class="error-text">Something went wrong</p>
        <p class="error-subtext">We couldn't load the chat. Give it another shot.</p>
        <button class="retry-button" onclick={() => chatStore.init(influencer.id)}>
          <svg class="retry-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M13.65 2.35A7.96 7.96 0 0 0 8 0a8 8 0 1 0 8 8h-2a6 6 0 1 1-1.76-4.24L9.5 6.5H16V0l-2.35 2.35Z"
              fill="currentColor"
            />
          </svg>
          Retry
        </button>
      </div>
    {:else if chatView.state === 'migrating'}
      {@const migBubbles = [
        { w: 48, side: 'right' },
        { w: 68, side: 'left' },
        { w: 42, side: 'right' },
        { w: 72, side: 'left' },
        { w: 50, side: 'right' },
      ]}
      <div class="mig-container">
        <div class="mig-visual">
          {#each migBubbles as b, i (i)}
            <div
              class="mig-row"
              class:mig-right={b.side === 'right'}
              class:mig-left={b.side === 'left'}
              style="--idx: {i}"
            >
              <div class="mig-bubble" style:width="{b.w}%"></div>
            </div>
          {/each}
        </div>
        <div class="mig-status">
          <span class="mig-spinner"></span>
          <p class="mig-label">Syncing your conversation</p>
        </div>
      </div>
    {:else if chatView.state !== 'conversation'}
      <div class="starter-greeting">
        <div class="greeting-content">
          <p class="greeting-subtitle" class:greeting-animate={greetingAnimStarted}>
            {#each greetingChars as char, i (i)}
              <span class="greeting-letter" style="animation-delay: {i * letterDelay}ms"
                >{char === ' ' ? '\u00A0' : char}</span
              >
            {/each}
          </p>
          <h2 class="greeting-title" class:greeting-title-visible={greetingAnimStarted}>
            {greetingTitle}
          </h2>
        </div>
        {#if chatView.state === 'loading'}
          <div class="skeleton-tiles-container">
            <div class="skeleton-grid">
              <div class="skeleton-tile"></div>
              <div class="skeleton-tile"></div>
              <div class="skeleton-tile"></div>
              <div class="skeleton-tile"></div>
            </div>
          </div>
        {:else}
          <ChatStarterTiles
            tiles={influencer.starterTiles ?? fallbackStarterTiles}
            onSelect={handleChatStarterTileClick}
            gender={influencer.gender}
          />
        {/if}

        {@render ageDisclaimer()}
        <p class="ai-disclaimer">
          This is an AI-powered conversation. Responses may vary, so use your judgment. Don’t share
          sensitive personal information.
        </p>
      </div>
    {:else}
      <div class="messages-list">
        {#each chatView.messages as message, index (message.id)}
          {@const animate = shouldAnimate(message)}
          {@const isVisible = shouldShowMessage(message, index)}
          {@const canShowPills = index === chatView.messages.length - 1}
          <ChatMessageContainer
            {message}
            isUser={chatStore.isUserMessage(message)}
            onSelection={handleSelection}
            onProductClick={handleProductClick}
            onImageClick={handleImageClick}
            onTypingComplete={() => handleTypingComplete(message.id)}
            disabled={chatStore.isTyping}
            {animate}
            visible={isVisible}
            allowPills={canShowPills}
          />
        {/each}

        {#if chatStore.isTyping}
          <ChatTypingIndicator />
        {/if}
        <div class="bottom-spacer" style:height="{spacerHeightPx}px"></div>
      </div>
    {/if}
  </div>

  {#if chatView.state === 'conversation'}
    {@render ageDisclaimer()}
  {/if}
  <ChatInput onSend={handleChatMessageSend} disabled={chatStore.isTyping || !chatStore.ready} />

  {#if expandedImageUrl}
    <div
      class="image-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded image view"
      transition:fade={{ duration: 250 }}
    >
      <button
        class="image-popup-close"
        onclick={closeExpandedImage}
        aria-label="Close"
        in:fade={{ duration: 200, delay: 150 }}
      >
        <CloseIcon />
      </button>
      <img
        src={expandedImageUrl}
        alt="Expanded look"
        class="image-popup-img"
        in:scale={{ duration: 300, start: 0.85, easing: cubicOut }}
        out:scale={{ duration: 200, start: 0.85 }}
      />
      <div class="image-popup-actions" role="toolbar" in:fade={{ duration: 200, delay: 150 }}>
        <button
          class="image-popup-action-btn"
          aria-label="Download"
          onclick={(e) => downloadExpandedImage(e, expandedImageUrl)}
        >
          <DownloadIcon />
        </button>
        <button
          class="image-popup-action-btn"
          aria-label="Share"
          onclick={(e) => shareExpandedImage(e, expandedImageUrl)}
        >
          <ShareIcon />
        </button>
      </div>
    </div>
  {/if}

  {#if cameraOverlayStore.isOpen}
    <Camera isReverseSearch={cameraOverlayStore.isReverseSearch} onClose={closeCameraOverlay} />
  {/if}

  <ChatHistoryDrawer startNewChat={startNewChat} influencerSlug={influencer.slug} />
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    background: #111;
    position: relative;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: clip;
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    position: relative;
    contain: layout style;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .messages-container::-webkit-scrollbar {
    display: none;
  }

  /* Skeleton shimmer tiles — shown during chat loading */
  .skeleton-tiles-container {
    display: flex;
    justify-content: center;
    padding: 1rem 1rem 0;
  }

  .skeleton-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    width: 100%;
    max-width: 388px;
  }

  .skeleton-tile {
    min-height: 10.875rem;
    border-radius: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    position: relative;
    overflow: hidden;
  }

  .skeleton-tile::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      110deg,
      transparent 25%,
      rgba(255, 255, 255, 0.06) 37%,
      transparent 50%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  .starter-greeting {
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: flex-end;
    overflow: hidden;
  }

  .greeting-content {
    text-align: center;
    padding: 0 3rem 1rem;
  }

  .greeting-subtitle {
    font-weight: 500;
    font-size: 1.125rem;
    margin: 0 0 1rem;
    line-height: 1.2;
    min-height: 1.35rem;
    overflow: hidden;
  }

  .greeting-letter {
    display: inline-block;
    color: rgba(138, 109, 255, 1);
    translate: 0 100%;
    opacity: 0;
  }

  .greeting-animate .greeting-letter {
    animation: letter-slide-up 350ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes letter-slide-up {
    to {
      translate: 0 0;
      opacity: 1;
    }
  }

  .greeting-title {
    font-weight: 700;
    font-size: 1.75rem;
    color: #fff;
    margin: 0;
    line-height: 1.15;
    letter-spacing: -0.03em;
    translate: 0 10px;
    opacity: 0;
    transition:
      translate 400ms cubic-bezier(0.16, 1, 0.3, 1),
      opacity 400ms ease;
  }

  .greeting-title-visible {
    translate: 0 0;
    opacity: 1;
  }

  .ai-disclaimer {
    font-weight: 400;
    font-size: 0.6875rem;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    color: rgba(255, 255, 255, 0.6);
    max-width: 22rem;
    margin: 5px auto 0;
  }

  .age-disclaimer {
    font-weight: 400;
    font-size: 0.6875rem;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    color: rgba(255, 255, 255, 0.6);
    max-width: 22rem;
    margin: 1rem auto;
    flex-shrink: 0;
  }

  /* Age disclaimer in starter-greeting context */
  .starter-greeting .age-disclaimer {
    margin: 2rem auto 0;
  }

  .age-disclaimer strong {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 400; /* override default bold */
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .bottom-spacer {
    flex-shrink: 0;
  }

  .image-popup-overlay {
    position: absolute;
    top: 3.5rem;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000;
    z-index: 20;
    padding: 1rem;
  }

  .image-popup-close {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    width: 2.25rem;
    height: 2.25rem;
    background: rgba(0, 0, 0, 0.8);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 1;
  }

  .image-popup-img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 0.75rem;
  }

  .image-popup-actions {
    position: absolute;
    bottom: 12%;
    left: 50%;
    transform: translate(-50%, 12%);
    display: flex;
    gap: 1rem;
  }

  .image-popup-action-btn {
    width: 2.5rem;
    padding: 0.625rem;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Migration: cascading pulse animation ── */

  .mig-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 2.5rem;
    padding: 2rem 1.5rem;
  }

  .mig-visual {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    width: 100%;
    max-width: 18rem;
  }

  .mig-row {
    display: flex;
    opacity: 0;
    animation: mig-rise 600ms calc(var(--idx) * 80ms) cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .mig-right {
    justify-content: flex-end;
  }

  .mig-left {
    justify-content: flex-start;
  }

  .mig-bubble {
    height: 2.25rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(138, 109, 255, 0.08);
    position: relative;
    overflow: hidden;
    animation: mig-border-pulse 2.8s calc(var(--idx) * 400ms) ease-in-out infinite;
  }

  .mig-right .mig-bubble {
    border-bottom-right-radius: 4px;
  }

  .mig-left .mig-bubble {
    border-bottom-left-radius: 4px;
  }

  .mig-bubble::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 30%,
      rgba(138, 109, 255, 0.1) 48%,
      rgba(138, 109, 255, 0.16) 50%,
      rgba(138, 109, 255, 0.1) 52%,
      transparent 70%
    );
    background-size: 300% 100%;
    animation: mig-sweep 2.4s calc(var(--idx) * 200ms) ease-in-out infinite;
  }

  @keyframes mig-rise {
    from {
      opacity: 0;
      translate: 0 16px;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes mig-border-pulse {
    0%,
    100% {
      border-color: rgba(138, 109, 255, 0.06);
      background: rgba(255, 255, 255, 0.025);
    }
    50% {
      border-color: rgba(138, 109, 255, 0.18);
      background: rgba(138, 109, 255, 0.035);
    }
  }

  @keyframes mig-sweep {
    0% {
      background-position: 150% 0;
    }
    100% {
      background-position: -150% 0;
    }
  }

  .mig-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.875rem;
    opacity: 0;
    animation: mig-rise 600ms 500ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .mig-spinner {
    display: block;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 2px solid rgba(138, 109, 255, 0.12);
    border-top-color: rgba(138, 109, 255, 0.6);
    animation: mig-spin 0.9s linear infinite;
  }

  @keyframes mig-spin {
    to {
      rotate: 360deg;
    }
  }

  .mig-label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: 0.03em;
    margin: 0;
  }

  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 0;
    padding: 2rem;
    animation: error-fade-in 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }

  @keyframes error-fade-in {
    to {
      opacity: 1;
    }
  }

  .error-icon {
    margin-bottom: 1.25rem;
    opacity: 0;
    animation: error-rise 600ms 100ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    translate: 0 6px;
  }

  @keyframes error-rise {
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  .error-text {
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.9375rem;
    font-weight: 500;
    text-align: center;
    margin: 0 0 0.375rem;
    opacity: 0;
    animation: error-rise 600ms 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    translate: 0 6px;
  }

  .error-subtext {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8125rem;
    text-align: center;
    margin: 0 0 1.5rem;
    line-height: 1.4;
    opacity: 0;
    animation: error-rise 600ms 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    translate: 0 6px;
  }

  .retry-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 2rem;
    color: #fff;
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0.625rem 1.5rem;
    cursor: pointer;
    transition:
      background 250ms ease,
      border-color 250ms ease;
    opacity: 0;
    animation: error-rise 600ms 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
    translate: 0 6px;
  }

  .retry-button:hover,
  .retry-button:active {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .retry-icon {
    transition: rotate 300ms ease;
  }

  .retry-button:hover .retry-icon,
  .retry-button:active .retry-icon {
    rotate: 90deg;
  }
</style>
