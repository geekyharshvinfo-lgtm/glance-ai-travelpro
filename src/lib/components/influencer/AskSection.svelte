<script lang="ts">
  import type { Influencer, AiAssistantSection } from '$lib/types';
  import { goto } from '$app/navigation';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { ChatIcon } from '../icons';
  import { trackEvent } from '$lib/utils/analytics';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';

  interface AskSectionProps {
    influencer: Influencer;
    aiAssistant: AiAssistantSection;
  }

  let { influencer, aiAssistant }: AskSectionProps = $props();

  function handleSuggestionClick(_suggestion: string) {
    // chatStore.setInputPreview({ text: _suggestion });
    // Track AI suggestion button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AI_SUGGESTION_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.AI_ACTIONS
    });
    chatStore.sendMessage(_suggestion);
    goto(`/${influencer.slug}/chat`);
  }

  function handleEmptyChat() {
    // Track Ask button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.ASK_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.AI_ACTIONS
    });
    chatStore.clearInputPreview();
    goto(`/${influencer.slug}/chat`);
  }
</script>

<section class="ai-chat-section">
  <div class="ask-section">
    <!-- Still not sure text -->
    <p class="still-not-sure">{aiAssistant.stillNotSureText}</p>

    <!-- Ask Button -->
    <button class="ask-billie-btn" onclick={handleEmptyChat}>
      <ChatIcon class="ask-billie-icon" />
      {aiAssistant.askButton.text}
    </button>
  </div>

  <!-- Suggestion Chips -->
  <div class="suggestion-chips">
    {#each aiAssistant.suggestions as suggestion, index (index)}
      {#if suggestion.text}
        <button class="suggestion-chip" onclick={() => handleSuggestionClick(suggestion.text)}>
          {#if suggestion.icon}
            <img
              src={suggestion.icon}
              alt="Suggestion Icon"
              class="chip-icon"
              loading="lazy"
              decoding="async"
            />
          {/if}
          {suggestion.text}
        </button>
      {/if}
    {/each}
  </div>

  <!-- Chat Input -->
  <button class="chat-input-link" onclick={handleEmptyChat}>
    <div class="chat-input-box">
      <span class="chat-input-placeholder">{aiAssistant.inputPlaceholder}</span>
      <div class="chat-input-send">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 17L17 7M17 7H8M17 7V16"
            stroke="#000"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>
  </button>
</section>

<style>
  .ai-chat-section {
    font-family:
      'Montserrat',
      -apple-system,
      BlinkMacSystemFont,
      sans-serif;
    margin: 1.5rem 0;
    position: relative;
    overflow: hidden;
  }

  .ask-section {
    padding: 1rem 1.5rem;
    background: rgba(36, 36, 36, 1);
  }

  .still-not-sure {
    font-size: 0.5rem;
    font-weight: 400;
    text-align: left;
    color: rgba(255, 255, 255, 1);
    margin-bottom: 0.25rem;
  }

  .ask-billie-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 1);
    font-size: 0.8125rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03125rem;
    text-decoration: none;
    width: fit-content;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .ask-billie-btn:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-0.0625rem);
  }

  .suggestion-chips {
    background: rgba(255, 255, 255, 0.6);
    display: flex;
    flex-wrap: wrap;
    gap: 0.625rem;
    padding: 1rem 1.5rem;
    padding-bottom: 4rem;
    background: linear-gradient(98.41deg, #111111 -5.86%, #1d1d1d 106.06%);
  }

  .suggestion-chip {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    background: linear-gradient(94.33deg, #111111 0%, #1d1d1d 98.94%);
    border: 0.5px solid rgba(225, 212, 190, 0.2);
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    text-decoration: none;
    box-shadow: 2px 2px 12px 0px rgba(255, 255, 255, 0.08);
    cursor: pointer;
  }

  .suggestion-chip:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  .chip-icon {
    width: 1rem;
    height: 1rem;
    object-fit: contain;
  }

  .chat-input-link {
    text-decoration: none;
    display: inline-block;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    border: none;
    background: transparent;
    padding: 0;
    cursor: pointer;
  }

  .chat-input-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1rem;
    height: 3.2775rem;
    box-shadow: 0px 0px 18.73px 0px rgba(226, 185, 129, 0.17);
    background: rgba(36, 36, 36, 1);
  }

  .chat-input-placeholder {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    font-weight: 400;
  }

  .chat-input-send {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.3);
    border: none;
    border-radius: 50%;
    height: 1.875rem;
    width: 1.875rem;
  }
</style>
