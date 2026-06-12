<script lang="ts">
  import { ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, PERFORMANCE_EVENT_ACTIONS, SECTION_NAMES } from '$lib/constants/analytics';
  import type { Influencer } from '$lib/types';
  import { trackEvent } from '$lib/utils/analytics';
  import { PlusIcon, HistoryIcon, ChatHeaderIconBg } from '$lib/components/icons';
  import { openChatHistoryDrawer } from '$lib/stores/chatHistoryStore.svelte';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { showToast } from '$lib/stores/toast.svelte';

  interface ChatHeaderProps {
    influencer: Influencer;
    startNewChat: () => void; // Function to start a new chat, passed from parent
  }

  let { influencer, startNewChat }: ChatHeaderProps = $props();

  function trackHeaderClickEvents(actionType: string, eventType: string) {
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: actionType,
      [ANALYTICS_EVENT_KEYS.eventType]: eventType,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.CHAT_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.CHAT_HEADER,
    });
  }

  function handleBackClick() {
    // Track back button click event
    trackHeaderClickEvents(PERFORMANCE_EVENT_ACTIONS.CHAT_CLOSED, EVENT_TYPES.CHAT_BACK_BUTTON_CLICK);
  }

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
    return `${s}s`;
  }

  function newChatButtonClick() {
    const ban = chatStore.getBanStatus(influencer.id);
    if (ban.banned) {
      const timeStr = ban.timeRemaining > 0 ? ` Restores in ${formatTime(ban.timeRemaining)}.` : '';
      showToast(`Chat is temporarily disabled.${timeStr}`, 'error');
      return;
    }
    startNewChat?.();
    trackHeaderClickEvents(AnalyticsEventAction.CLICKED, EVENT_TYPES.NEW_CHAT_BUTTON_CLICK);
  }

  function openChatHistory() {
    openChatHistoryDrawer(influencer.id);

    // Track chat history button click event
    trackHeaderClickEvents(AnalyticsEventAction.CLICKED, EVENT_TYPES.CHAT_HISTORY_BUTTON_CLICK);
  }
</script>

<header class="chat-name-bar">
  <div class="user-info">
    <a href="/{influencer.slug}" class="back-btn" aria-label="Go back" onclick={handleBackClick}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M15 18l-6-6 6-6"
          stroke="#fff"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </a>
    <div class="user-details">
      <img src={influencer.profileImage} alt={influencer.name} class="chat-avatar" />
      <span class="chat-name">{influencer.name}</span>
    </div>
  </div>

  <div class="header-actions">
    <button class="icon-btn" aria-label="New chat" onclick={newChatButtonClick}>
      <ChatHeaderIconBg class="icon-bg" />
      <PlusIcon width={20} height={20} class="icon-content" />
    </button>
    <button class="icon-btn" aria-label="Chat history" onclick={openChatHistory}>
      <ChatHeaderIconBg class="icon-bg" />
      <HistoryIcon width={20} height={20} class="icon-content" />
    </button>
  </div>
</header>

<style>
  .chat-name-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0rem 1.5rem;
    height: 3.5rem;
    background: #111;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 1.5rem;
    text-decoration: none;
  }

  .user-details {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .chat-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .chat-name {
    font-weight: 600;
    font-size: 1rem;
    color: #fff;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .icon-btn {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    backdrop-filter: blur(6.5px);
    border-radius: 50%;
  }

  :global(.icon-btn .icon-bg) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  :global(.icon-btn .icon-content) {
    position: relative;
    z-index: 1;
  }
</style>
