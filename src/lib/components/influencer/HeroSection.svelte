<script lang="ts">
  import type { Influencer, HeroSection } from '$lib/types';
  import { ChatIcon, StyleMeWhiteIcon, GlanceGLogoIcon, AiSparkleIcon, ShareArrowIcon } from '../icons';
  import ProfileDropdown from '../profile/ProfileDropdown.svelte';
  import TryOnImageContainer from '../common/TryOnImageContainer.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import { showLoginPopup } from '$lib/stores/login.svelte';
  import { startOnboarding } from '$lib/stores/onboarding.svelte';
  import { LOGIN_REQUIRED } from '$lib/config/env';
  import {
    profileStore,
    toggleProfileDropdown,
    closeProfileDropdown,
  } from '$lib/stores/profile.svelte';
  import { useTryOn } from '$lib/composables/useTryOn.svelte';
  import type { TryOnItem } from '$lib/utils/tryOnUtil';
  import { goto } from '$app/navigation';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { shareExpandedImage } from '$lib/utils/imageActionHandlers';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import { trackEvent } from '$lib/utils/analytics';
  import { tryOnStore } from '$lib/stores/tryOnStore.svelte';
  import { handleChatMessageSend } from '$lib/utils/chat';

  interface HeroSectionProps {
    influencer: Influencer;
    heroSection: HeroSection;
    heroPreloadUrl?: string; // Preloaded optimized hero image URL
  }

  let { influencer, heroSection, heroPreloadUrl }: HeroSectionProps = $props();

  const styleMeHandler = $derived(useTryOn(influencer.id));
  const isButtonDisabled = $derived(styleMeHandler.isButtonDisabled);
  const composableHandleStyleMeClick = $derived(styleMeHandler.handleStyleMeClick);
  const handleTryOnImageLoadComplete = $derived(styleMeHandler.handleTryOnImageLoadComplete);

  // Create hero item structure for try-on
  const heroItem = $derived<TryOnItem>({
    id: heroSection.items?.[0]?.id || heroSection.id,
    image: heroSection.items?.[0]?.collectionImage,
    name: `${influencer.name} Hero Look`,
  });

  // Reactive preloadUrl: only use static preloadUrl when there's no try-on result
  // This ensures the image updates when try-on completes
  const reactivePreloadUrl = $derived(
    tryOnStore.tryOnResults[heroItem.id] 
      ? undefined  // Don't use preloadUrl when try-on result exists
      : (heroSection.items?.[0]?.ai_look || heroPreloadUrl)
  );

  const FALLBACK_PLACEHOLDERS = [
    'Relaxed baggy outfits...',
    'Find something classic...',
    'Fitted and cropped styling',
    'Casual and comfy outfits...',
  ];

  const placeholders = $derived(
    influencer.searchPlaceholders?.length ? influencer.searchPlaceholders : FALLBACK_PLACEHOLDERS
  );

  // 3s per item total cycle
  const totalDuration = $derived(placeholders.length * 3);

  // One keyframe: fade+slide in, hold, fade+slide out, reset while hidden
  // Each item occupies 1/n of the total cycle
  // Do not delete this dynamic keyframe generation logic - it ensures the animation timing always matches the number of placeholders, even if it changes dynamically
  const keyframesStyle = $derived((() => {
    const n = placeholders.length;
    const slot = 100 / n;
    const fi = (slot * 0.12).toFixed(2);   // fade in complete
    const ho = (slot * 0.88).toFixed(2);   // hold end
    const sl = slot.toFixed(2);             // slot end (faded out)
    const reset = (slot + 0.01).toFixed(2); // snap back for hidden phase
    return `@keyframes ph-fade {
      0% { opacity: 0; transform: translateY(7px); }
      ${fi}% { opacity: 1; transform: translateY(0); }
      ${ho}% { opacity: 1; transform: translateY(0); }
      ${sl}% { opacity: 0; transform: translateY(-7px); }
      ${reset}%, 100% { opacity: 0; transform: translateY(7px); }
    }`;
  })());

  const eventOptions = {
    [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
    [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.HERO
  };

  function handleUpdateSelfie() {
    closeProfileDropdown();

    if (LOGIN_REQUIRED && !userStore.isLoggedIn && !userStore.profileImage) {
      showLoginPopup({ allowSkip: true });
    } else {
      startOnboarding();
    }
  }

  async function handleStyleMeClick() {
    // Use composable's handler with hero item

    await composableHandleStyleMeClick(heroItem, eventOptions);
  }

  function handleAskClick() {
    // Track Ask button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.ASK_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.HERO,
      [ANALYTICS_EVENT_KEYS.productId]: heroSection.id
    });

    handleChatMessageSend('Find me something similar', { url: heroSection.items?.[0]?.collectionImage },
    );
    goto(`/${influencer.slug}/chat`);
  }

  function handleProfileIconClick() {
    toggleProfileDropdown();
    // Track profile icon click
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PROFILE_ICON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.NAVBAR,
      [ANALYTICS_EVENT_KEYS.label]: 'profile_icon',
    });
  }
</script>

<!-- Fixed top nav header — outside hero to avoid overflow:hidden clipping -->
<header class="top-nav">
  <button
    class="top-nav-logo"
    onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    aria-label="Scroll to top"
  >
    <GlanceGLogoIcon width={23} height={30} />
  </button>

  <button
    class="top-nav-search"
    onclick={() => goto(`/${influencer.slug}/chat`)}
    aria-label="Search with AI"
  >
    <div class="search-container">
      <AiSparkleIcon width={15} height={18} />
      <div class="search-placeholder-wrapper">
        {@html `<style>${keyframesStyle}</style>`}
        {#each placeholders as text, i (i)}
          <span
            class="search-placeholder"
            style="animation-duration: {totalDuration}s; animation-delay: {i * 3}s;"
          >{text}</span>
        {/each}
      </div>
    </div>
  </button>

  <button class="top-nav-profile" onclick={handleProfileIconClick} aria-label="Profile">
    {#if userStore.profileImage}
      <img src={userStore.profileImage} alt="Profile" class="profile-img" />
    {:else}
      <img
        src="https://x-stg.glance-cdn.com/public/content/assets/other/influencer-profile-icon.svg"
        alt="Profile"
        class="profile-icon"
      />
    {/if}
  </button>
</header>

<ProfileDropdown
  isOpen={profileStore.isOpen}
  onUpdateSelfie={handleUpdateSelfie}
  onClose={closeProfileDropdown}
/>

<section class="hero" data-item-id={heroItem.id}>
  <TryOnImageContainer
    item={{ ...heroSection, ...heroItem, products: heroSection.items?.[0]?.products, ai_look: heroSection.items?.[0]?.ai_look }}
    variant="hero"
    onImageLoad={handleTryOnImageLoadComplete}
    linkUrl="/{influencer.slug}/collection"
    sectionName={SECTION_NAMES.HERO}
    preloadUrl={reactivePreloadUrl}
    cardIndex={0}
  />

  <!-- Action buttons -->
  <div class="hero-right-actions">
    <button class="action-btn" onclick={handleAskClick}>
      <ChatIcon />
    </button>
    <button
      class="action-btn"
      onclick={(e) => shareExpandedImage(e, heroSection.items?.[0]?.collectionImage, eventOptions)}
    >
      <ShareArrowIcon />
    </button>
  </div>
  {#if !isButtonDisabled(heroItem.id)}
    <button class="style-me-btn" onclick={handleStyleMeClick}>
      <StyleMeWhiteIcon />
      Style Me
    </button>
  {/if}
</section>

<style>
  @property --border-angle-1 {
    syntax: '<angle>';
    inherits: true;
    initial-value: 0deg;
  }

  @property --border-angle-2 {
    syntax: '<angle>';
    inherits: true;
    initial-value: 180deg;
  }

  @keyframes rotateBackground1 {
    to {
      --border-angle-1: 360deg;
    }
  }

  @keyframes rotateBackground2 {
    to {
      --border-angle-2: 540deg;
    }
  }

  .hero {
    position: relative;
    overflow: hidden;
    padding-top: 4.875rem; /* Space for fixed top nav */
  }

  /* ── Fixed top nav header ── */
  .top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4.875rem;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0 1rem;
    background: linear-gradient(180deg, #111111 75%, rgba(17, 17, 17, 0) 100%);
  }

  .top-nav-logo {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .top-nav-search {
    --border-angle-1: 0deg;
    --border-angle-2: 180deg;
    flex: 1;
    height: 2.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1px;
    border-radius: 1.25rem;
    border: 0;
    background-color: transparent;
    box-shadow: 0px 1px 8px 0px rgba(81, 83, 176, 0.65);
    cursor: pointer;
    background-image:
      conic-gradient(
        from var(--border-angle-1),
        rgba(212, 95, 218, 0.8),
        rgba(118, 90, 234, 0.15) 50%,
        rgba(212, 95, 218, 0.8)
      ),
      conic-gradient(
        from var(--border-angle-2),
        rgba(118, 90, 234, 0.8),
        rgba(212, 95, 218, 0.15) 50%,
        rgba(118, 90, 234, 0.8)
      );
    animation:
      rotateBackground1 2s linear infinite,
      rotateBackground2 2s linear infinite;
  }

  .search-container {
    background-color: #111111;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    width: 100%;
    gap: 0.5rem;
    height: 100%;
    border-radius: calc(1.25rem - 1px);
  }

  .search-placeholder-wrapper {
    flex: 1;
    height: 1.2em;
    overflow: hidden;
    position: relative;
  }

  .search-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    text-align: left;
    font-size: 0.8125rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2em;
    opacity: 0;
    animation-name: ph-fade;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
  }


  .top-nav-profile {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: linear-gradient(180deg, #3b3b3b 0%, #111111 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
    padding: 0;
    border: 0.67px solid rgba(255, 255, 255, 0.3);
  }

  .profile-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .profile-icon {
    width: 0.875rem;
  }

  .style-me-btn {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 3.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    padding: 0 1rem;
    gap: 0.75rem;
    color: white;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
    text-decoration: none;
    background: linear-gradient(94.33deg, #111111 0%, #424242 98.94%);
    border: 1px solid rgba(255, 255, 255, 0.21);
    cursor: pointer;
    text-transform: uppercase;
  }

  .hero-right-actions {
    position: absolute;
    right: 1rem;
    bottom: 3.6rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    z-index: 2;
  }

  .action-btn {
    width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s ease;
    border-radius: 36px;
    border: 0.72px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(12px);
  }

  .action-btn:hover {
    transform: scale(1.05);
  }
</style>
