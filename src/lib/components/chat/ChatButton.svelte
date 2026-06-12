<script lang="ts">
  import ChatIcon from '$lib/assets/chat-icon.png';
  import type { Influencer } from '$lib/types';
  import { goto } from '$app/navigation';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { trackEvent } from '$lib/utils/analytics';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES } from '$lib/constants/analytics';

  let { influencer }: { influencer: Influencer } = $props();

  function handleClick() {
    // Track Ask button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.CHAT_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
    });
    chatStore.clearInputPreview();
    goto(`/${influencer.slug}/chat`);
  }
</script>

<button class="ask-button" onclick={handleClick}>
  <img src={ChatIcon} alt="Chat" />
</button>

<style>
  .ask-button {
    position: fixed;
    z-index: 999;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    bottom: 4.2rem;
    right: 1.5rem;
    width: 3.25rem;
    height: 3.25rem;
    border: none;
    border-radius: 50%;
    box-shadow:
      -1.29px 1.29px 3.68px 0px rgba(212, 95, 218, 1) inset,
      0.55px -1.47px 16px 0px rgba(118, 90, 234, 1) inset;
    background:
      radial-gradient(
          63.26% 63.26% at 43.55% 45.3%,
          rgba(19, 19, 26, 0) 0%,
          rgba(19, 19, 26, 0.31) 63.02%,
          #13131a 100%
        )
        /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */,
      radial-gradient(60.58% 60.58% at 43.55% 45.3%, #13131a 31.97%, rgba(19, 19, 26, 0.52) 100%);
    img {
      width: 1.5rem;
      height: 1.5rem;
    }
  }
</style>
