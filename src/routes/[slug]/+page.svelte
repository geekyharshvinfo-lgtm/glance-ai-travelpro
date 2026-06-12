<script lang="ts">
  import type { PageData } from './$types';
  import HeroSection from '$lib/components/influencer/HeroSection.svelte';
  import QuickActionsBar from '$lib/components/influencer/QuickActionsBar.svelte';
  import LatestSection from '$lib/components/influencer/LatestSection.svelte';
  import AskSection from '$lib/components/influencer/AskSection.svelte';
  import LookCollectionSection from '$lib/components/influencer/LookCollection.svelte';
  import WardrobeSection from '$lib/components/influencer/WardrobeSection.svelte';
  import Footer from '$lib/components/influencer/Footer.svelte';
  import ChatButton from '$lib/components/chat/ChatButton.svelte';
  import { CrossIcon } from '$lib/components/icons';
  import { browser } from '$app/environment';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { onMount } from 'svelte';
  import CollectionDrawer from '$lib/components/collection/CollectionDrawer.svelte';
  import LookGridSection from '$lib/components/collection/LookGridSection.svelte';
  import { trackEvent } from '$lib/utils/analytics';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES } from '$lib/constants/analytics';
  import { usePageTracking } from '$lib/composables/usePageTracking.svelte';
  import { CookieConsentBottomSheet } from '$lib/components/bottomsheets';
  import { getHeroPreloadUrl } from '$lib/utils/imageOptimization';

  interface InfluencerPageProps {
    data: PageData;
  }

  let { data }: InfluencerPageProps = $props();

  const influencer = $derived(data.influencer);
  const sections = $derived(data.sections);
  const footerData = $derived(data.footerData);

  let showCookiesConsent = $state(false); // Placeholder for cookie consent logic
  // Get hero image for preloading (optimized)
  const heroSection = $derived(sections.find(s => s.type === 'hero'));
  const heroImageUrl = $derived(heroSection?.items?.[0]?.collectionImage);
  const heroPreloadUrlMobile = $derived(getHeroPreloadUrl(heroImageUrl));

  onMount(() => {
    chatStore.clearInputPreview();
    if (browser) {
      localStorage.setItem('influencer_gender', influencer.gender);
      localStorage.setItem('influencer_id', influencer.id);

      // check cookie consent display logic on mount
      const consentAcknowledged = localStorage.getItem('cookieConsentAcknowledged');
      if (consentAcknowledged) {
        showCookiesConsent = false;
      } else {
        showCookiesConsent = true;
      }
    }

    // Track page lifecycle (session tracking)
    usePageTracking({
      pageName: PAGE_NAMES.HOME_PAGE,
      metadata: {
        influencerId: influencer.id,
        influencerSlug: influencer.slug,
        influencerName: influencer.name,
        influencerGender: influencer.gender,
      }
    });
  });

  $effect(() => {
    console.log(sections);
  });

  // CTA visibility state
  let showCTA = $state(true);

  function handleCTAClick() {
    // Track Glance AI button click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.GLANCE_AI_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE
    });
    // const isIOS =
    //   /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
    // const storeLink = isIOS ? footerData.appStoreLink : footerData.googlePlayLink;
    window.open(footerData.oneLinkUrl, '_blank');
  }

  function handleCloseCTA(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    // Track Glance AI button close click event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.GLANCE_AI_BUTTON_CLOSE_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE
    });

    showCTA = false;
  }

  function handleConsentClose() {
    showCookiesConsent = false;

    // Track cookie consent acknowledgment event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.COOKIE_CONSENT_ACKNOWLEDGED,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.HOME_PAGE
    });
  }
</script>

<svelte:head>
  <title>{influencer.name} | AI Influencer</title>
  
  <!-- Preload optimized hero image for faster LCP (Largest Contentful Paint) -->
  <!-- Mobile-first: preload mobile version with highest priority -->
  {#if heroPreloadUrlMobile}
    <link 
      rel="preload" 
      as="image" 
      href={heroPreloadUrlMobile} 
      fetchpriority="high"
      media="(max-width: 768px)"
    />
  {/if}
</svelte:head>

<!-- Render sections dynamically based on type and priority -->
{#each sections as section (section.id)}
  <div data-section-name={'title' in section ? section.title : section.type}>
    {#if section.type === 'hero'}
      <HeroSection {influencer} heroSection={section} heroPreloadUrl={heroPreloadUrlMobile} />
      {#if section.items?.[0]?.products?.length}
        <QuickActionsBar
          products={section.items?.[0]?.products}
          productLimit={influencer.slug === 'oprah-winfrey' ? 1 : 3}
        />
      {/if}
    {:else if section.type === 'editorial'}
      <LatestSection latestSection={section} {influencer} />
    {:else if section.type === 'ai_actions'}
      <AskSection {influencer} aiAssistant={section} />
    {:else if section.type === 'look_collection'}
      <LookCollectionSection {influencer} lookCollectionSection={section} />
    {:else if section.type === 'product_grid'}
      <WardrobeSection wardrobeSection={section} influencerId={influencer.slug || influencer.id} influencerSlug={influencer.slug} />
    {:else if section.type === 'look_grid'}
      <LookGridSection homeSection={section} influencerId={influencer.slug || influencer.id} showChatButton={true} />
    {/if}
  </div>
{/each}

<Footer {footerData} />
<ChatButton {influencer} />

<CollectionDrawer slug={influencer.slug} influencerId={influencer.id} gender={influencer.gender}/>

<!-- Cookie consent bottom sheet - can be conditionally rendered based on cookie consent logic -->
{#if showCookiesConsent}
  <CookieConsentBottomSheet isOpen={showCookiesConsent} onClose={handleConsentClose} />
{/if}

<!-- Fixed CTA Button -->
{#if showCTA}
  <div class="fixed-cta">
    <button class="cta-text-section" onclick={handleCTAClick}> Open Glance AI app </button>
    <button class="cta-close-section" onclick={handleCloseCTA}>
      <CrossIcon />
    </button>
  </div>
{/if}

<style>
  .fixed-cta {
    position: fixed;
    bottom: 4.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    background: #fff;
    box-shadow: 2px 2px 12px 0px rgba(0, 0, 0, 0.32);
    border-radius: 16px;
    height: 2.25rem;
  }

  .cta-text-section {
    display: flex;
    align-items: center;
    padding: 0 0 0 1rem;
    font-family: 'Montserrat';
    font-weight: 500;
    font-size: 0.75rem;
    line-height: 1rem;
    color: black;
    cursor: pointer;
    flex: 1;
    height: 100%;
    border: none;
    background: transparent;
  }

  .cta-close-section {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 0.5rem 0.5rem 0;
    cursor: pointer;
    height: 100%;
    border: none;
    background: transparent;
  }

  .cta-close-section:hover {
    opacity: 0.7;
  }
</style>
