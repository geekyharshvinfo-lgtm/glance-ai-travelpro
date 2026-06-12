<script lang="ts">
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { chatHistoryStore, closeChatHistoryDrawer } from '$lib/stores/chatHistoryStore.svelte';
  import { getConversations, deleteConversation, type ConversationSummary, type ConversationsResponse } from '$lib/api/chat';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PlusIcon, RecentChatsIcon, RetryIcon, CloseIcon, ErrorGlow, ErrorIcon, EmptyStateIcon, ThreeDotsIcon, DeleteIcon } from '$lib/components/icons';
  import { trackEvent } from '$lib/utils/analytics';
  import { ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import { showToast } from '$lib/stores/toast.svelte';

  interface ChatHistoryDrawerProps {
    startNewChat: () => void;
    influencerSlug: string;
  }
  let { startNewChat, influencerSlug }: ChatHistoryDrawerProps = $props();

  type DrawerStatus = 'loading' | 'loaded' | 'error';

  const PAGE_SIZE = 10;

  let status = $state<DrawerStatus>('loading');
  let conversations = $state<ConversationSummary[]>([]);
  let activeMenuId = $state<string | null>(null);
  let nextCursor = $state<string | undefined>(undefined);
  let hasMore = $state(false);
  let isLoadingMore = $state(false);
  let contentEl = $state<HTMLElement | undefined>();

  let isOpen = $derived(chatHistoryStore.isOpen);
  let influencerId = $derived(chatHistoryStore.influencerId);
  let activeConvId = $derived(chatStore.messagesPath?.split('/')[5] ?? null); // to highlight active conv in history

  $effect(() => {
    if (!isOpen || !influencerId) return;

    status = 'loading';
    conversations = [];
    nextCursor = undefined;
    hasMore = false;

    getConversations(influencerId, PAGE_SIZE)
      .then((res: ConversationsResponse) => {
        conversations = res.conversations ?? [];
        hasMore = res.hasMore;
        nextCursor = res.nextCursor;
        status = 'loaded';
      })
      .catch(() => {
        status = 'error';
      });
  });

  async function loadMore() {
    if (!influencerId || isLoadingMore || !hasMore || !nextCursor) return;

    isLoadingMore = true;

    try {
      const res = await getConversations(influencerId, PAGE_SIZE, nextCursor);
      conversations = [...conversations, ...(res.conversations ?? [])];
      hasMore = res.hasMore;
      nextCursor = res.nextCursor;
    } catch {
      // silently fail — user can scroll again to retry
    } finally {
      isLoadingMore = false;
    }
  }

  function handleContentScroll() {
    if (!contentEl) return;
    const { scrollTop, scrollHeight, clientHeight } = contentEl;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      loadMore();
    }
  }

  function slideIn(_node: HTMLElement) {
    return {
      duration: 300,
      easing: cubicOut,
      css: (t: number) => `transform: translateX(${(1 - t) * 100}%)`,
    };
  }

  function slideOut(_node: HTMLElement) {
    return {
      duration: 250,
      easing: cubicOut,
      css: (t: number) => `transform: translateX(${(1 - t) * 100}%)`,
    };
  }

  function formatTime(ts: string): string {
    const date = new Date(ts);
    const now = new Date();
    const h = date.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    const timeStr = `${displayHour}${ampm}`;
    const isToday = date.toDateString() === now.toDateString();
    const dateStr = isToday
      ? 'TODAY'
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
    return `${timeStr} | ${dateStr}`;
  }

  function trackClickEvents(actionType: string, eventType: string) {
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: actionType,
      [ANALYTICS_EVENT_KEYS.eventType]: eventType,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.CHAT_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.CHAT_HISTORY_DRAWER,
    });
  }

  function retryHistoryFetch() {
    if (!influencerId) return;

    status = 'loading';
    conversations = [];
    nextCursor = undefined;
    hasMore = false;
    getConversations(influencerId, PAGE_SIZE)
      .then((res: ConversationsResponse) => {
        conversations = res.conversations ?? [];
        hasMore = res.hasMore;
        nextCursor = res.nextCursor;
        status = 'loaded';
      })
      .catch(() => {
        status = 'error';
      });

    trackClickEvents(AnalyticsEventAction.CLICKED, EVENT_TYPES.CHAT_HISTORY_RETRY_CLICK);
  }

  function formatRestoreTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
  }

  function newChatButtonClick() {
    if (influencerId) {
      const ban = chatStore.getBanStatus(influencerId);
      if (ban.banned) {
        const timeStr = ban.timeRemaining > 0 ? ` Restores in ${formatRestoreTime(ban.timeRemaining)}.` : '';
        showToast(`Chat is temporarily disabled.${timeStr}`, 'error');
        return;
      }
    }
    startNewChat?.();
    closeChatHistoryDrawer();
    trackClickEvents(AnalyticsEventAction.CLICKED, EVENT_TYPES.NEW_CHAT_BUTTON_CLICK);
  }

  function closeChatHistory() {
    closeChatHistoryDrawer();

    // Track chat history drawer close event
    trackClickEvents(AnalyticsEventAction.CLICKED, EVENT_TYPES.CHAT_HISTORY_CLOSE_BUTTON_CLICK);
  }

  function handleConversationClick(conv: ConversationSummary) {
    chatStore.loadConversationFromHistory(conv.path);
    closeChatHistoryDrawer();

    const chatPath = `/${influencerSlug}/chat`;
    if ($page.url.pathname === chatPath) {
      // Already on chat page — onMount won't re-fire, call init directly
      chatStore.init(influencerId);
    } else {
      goto(chatPath);
    }
  }

  function toggleMenu(convId: string, e: Event) {
    e.stopPropagation();
    activeMenuId = activeMenuId === convId ? null : convId;
  }

  function handleDeleteChat(convId: string, e: Event) {
    e.stopPropagation();
    activeMenuId = null;
    const snapshot = conversations;
    conversations = conversations.filter((c) => c.conversationId !== convId);

    // If the deleted conversation is currently open, clear its cache and start new
    const activeConvId = chatStore.messagesPath?.split('/')[5];
    if (activeConvId === convId && influencerId) {
      chatStore.clearConversationCache(influencerId);
      startNewChat();
      closeChatHistoryDrawer();
    }

    if (influencerId) {
      deleteConversation(influencerId, convId);
    }
  }

</script>

<svelte:window onclick={() => (activeMenuId = null)} />

{#if isOpen}
  <div class="overlay" transition:fade={{ duration: 300 }} role="presentation">
    <div class="panel" in:slideIn out:slideOut role="dialog" aria-label="Recent chats">
      <div class="panel-header">
        <div class="header-row">
          <span class="panel-title">RECENT CHATS</span>
          <RecentChatsIcon width={26} height={26} />
        </div>
        
        <div class="panel-header-row">
          <div class="header-spacer"></div>
          <button class="close-btn" onclick={closeChatHistory} aria-label="Close">
            <CloseIcon strokeWidth={2} />
          </button>
        </div>
      </div>

      <button class="new-chat-btn" onclick={newChatButtonClick}>
        <PlusIcon width={16} height={16} stroke="#fff" strokeWidth={4}/>
        <span>New chat</span>
      </button>

      <div class="content" bind:this={contentEl} onscroll={handleContentScroll}>
        {#if status === 'loading'}
          {#each Array(4) as _, i (i)}
            <div class="skeleton-item shimmer"></div>
          {/each}
        {:else if status === 'error'}
          <div class="empty-state">
            <div class="state-icon error-icon">
              <ErrorGlow class="error-glow"/>
              <ErrorIcon class="error-icon-svg"/>
            </div>
            <p class="state-title">Could not load chat</p>
            <button class="retry-btn" onclick={retryHistoryFetch} >
              <RetryIcon />
              Retry
            </button>
          </div>
        {:else if conversations.length === 0}
          <div class="empty-state">
            <div class="state-icon">
              <EmptyStateIcon />
            </div>
            <div class="state-text">
              <p class="state-title">Chat history empty</p>
              <p class="state-subtitle">Start a chat now</p>
            </div>
            
          </div>
        {:else}
          <ul class="conversation-list">
            {#each conversations as conv (conv.conversationId)}
              <li class="conversation-item" class:active={conv.conversationId === activeConvId}>
                <button class="conv-btn" onclick={() => handleConversationClick(conv)}>
                  <div class="conv-info">
                    <p class="conv-title">{conv.title}</p>
                    <p class="conv-time">{formatTime(conv.updatedAt)}</p>
                  </div>
                </button>
                <div class="menu-wrapper">
                  <button class="menu-btn" aria-label="More options" onclick={(e) => toggleMenu(conv.conversationId, e)}>
                    <ThreeDotsIcon />
                  </button>
                  {#if activeMenuId === conv.conversationId}
                    <div class="menu-dropdown">
                      <button class="delete-btn" onclick={(e) => handleDeleteChat(conv.conversationId, e)}>
                        <DeleteIcon width={16} height={16} fill="#E05252" />
                        Delete this chat
                      </button>
                    </div>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
          {#if isLoadingMore}
            <div class="load-more-spinner">
              {#each Array(2) as _, i (i)}
                <div class="skeleton-item shimmer"></div>
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
  }

  .panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 75%;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    border-radius: 8px 0 0 8px;
    border: 1px solid #2D2D2D;
    background: #101010;
    color: white;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    flex-direction: column;
    /* gap: 0.75rem; */
    padding: 1.5rem 1.25rem 1rem;
    flex-shrink: 0;
  }

  .panel-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #fff;
    display: flex;
    align-items: center;
  }

  .header-row{
    display: flex;
    gap: 0.75rem;
  }

  .panel-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-spacer {
    width: 2.75rem;
    height: 2.75rem;
    flex-shrink: 0;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    background: #151515;
    border: 1px solid #2D2D2D;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
  }

  .new-chat-btn {
    gap: 0.5rem;
    margin: 0 1.25rem 1rem;
    padding: 0.75rem 1rem;
    flex-shrink: 0;
    display: flex;
    padding: 14px 10px;
    align-items: flex-start;
    gap: 10px;
    align-self: stretch;
    border-radius: 6px;
    background: #232323;
    box-shadow: 4px 4px 17px 0 rgba(119, 119, 119, 0.25) inset;
    color: #FFF;
    font-size: 14px;
    font-style: normal;
    font-weight: 700;
    line-height: 125%; /* 17.5px */
  }

  .new-chat-btn:active {
    background: rgba(255, 255, 255, 0.06);
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: 0 1.25rem;
    scrollbar-width: none;
  }

  .content::-webkit-scrollbar {
    display: none;
  }

  .load-more-spinner {
    padding: 0.5rem 0;
  }

  /* Loading skeletons */
  .skeleton-item {
    height: 3rem;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    background: rgba(255, 255, 255, 0.06);
  }

  .shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Empty / error state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    gap: 2rem;
  }

  .state-icon {
    width: 5rem;
    height: 5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.75rem;
    border-radius: 64px;
    border: 0.595px solid rgba(255, 255, 255, 0.60);
    background: radial-gradient(86.15% 86.15% at 50% 100%, rgba(255, 255, 255, 0.10) 23.5%, rgba(0, 0, 0, 0.10) 79.5%);
  }

  .error-icon {
    background: none;
    position: relative;
    overflow: visible;
    width: 5rem;
    height: 5rem;
  }

  :global(.error-glow) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    fill: rgba(220, 68, 68, 0.26);
    filter: blur(20px);
  }

  :global(.error-icon-svg) {
    position: relative;
    z-index: 1;
  }

  .state-text{
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
  }

  .state-title {
    color: #FFF;
    text-align: center;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 125%; /* 20px */
  }

  .state-subtitle {
    color: #FFF;
    text-align: center;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 7.485px; /* 46.78% */
    opacity: 0.7;
  }

  .retry-btn {
    margin-top: 0.75rem;
    padding: 0.5rem 1.25rem;
    display: flex;
    padding: 8px 16px;
    justify-content: center;
    align-items: center;
    gap: 5px;
    border-radius: 4px;
    border: 1px solid #9C3031;
    background: #200A10;
    color: #FFF;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
  }

  /* Conversation list */
  .conversation-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .conversation-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0.625rem;
    cursor: pointer;
    gap: 0.5rem;
  }

  .conversation-item.active {
    border-radius: 6px;
    border: 1px solid #313131;
    background: #232323;
  }

  .conv-btn {
    flex: 1;
    min-width: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    text-align: left;
  }

  .conv-info {
    flex: 1;
    min-width: 0;
  }

  .conv-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 0.2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .conv-time {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
    letter-spacing: 0.02em;
  }

  .menu-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    padding: 0;
  }

  /* .menu-btn:hover {
    background: rgba(255, 255, 255, 0.08);
  } */

  .menu-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    /* background: #111;
    border-radius: 12px;
    padding: 0.25rem; */
    z-index: 10;
    min-width: 10rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  }

  .delete-btn {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: #040404;
    border-radius: 12px;
    border: 0.65px solid #363636;
    cursor: pointer;
    white-space: nowrap;
    color: #FF7070;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 125%; /* 17.5px */
  }

  .delete-btn:hover {
    background: rgba(255, 255, 255, 0.06);
  }
</style>
