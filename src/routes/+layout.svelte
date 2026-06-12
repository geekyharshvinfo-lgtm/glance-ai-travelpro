<script lang="ts">
  import { type Snippet } from 'svelte';
  import '../app.css';
  import ToastContainer from '$lib/components/common/ToastContainer.svelte';
  import { authService } from '$lib/services/auth';
  import { loginStore } from '$lib/stores/login.svelte';
  import { onboardingStore } from '$lib/stores/onboarding.svelte';
  import { onNavigate } from '$app/navigation';
  import { onMount } from 'svelte';
  import { loadSentinel, updateSentinelUserId } from '$lib/utils/analytics';
  import { API_ENDPOINTS, CDN_RESIZER_BASE } from '$lib/config/env';
  import { userStore } from '$lib/stores/user.svelte';

  interface LayoutProps {
    children: Snippet;
  }

  let { children }: LayoutProps = $props();

  // Extract domains for preconnect (remove paths)
  const imageCdnDomain = $derived(API_ENDPOINTS.IMAGE_CDN);
  const resizerDomain = $derived(new URL(CDN_RESIZER_BASE).origin);

  function getRouteDepth(url: URL): number {
    return url.pathname.replace(/\/$/, '').split('/').length;
  }

  onNavigate((navigation) => {
    if (!document.startViewTransition || !navigation.from || !navigation.to) return;

    const fromDepth = getRouteDepth(navigation.from.url);
    const toDepth = getRouteDepth(navigation.to.url);
    const direction = toDepth >= fromDepth ? 'forward' : 'back';

    document.documentElement.dataset.transition = direction;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  // Initialize services on mount
  onMount(() => {
    authService.initialize();
    
    // Initialize Sentinel analytics
    loadSentinel({
      pageName: 'APP_INIT',
      url: window.location.href,
      referrer: document.referrer
    });
  });

  // Update Sentinel userId reactively when user logs in or accountId changes
  // $effect(() => {
  //   if (userStore.accountId) {
  //     updateSentinelUserId(userStore.accountId);
  //   }
  // });
</script>

<svelte:head>
  <!-- Preconnect to CDN domains for faster image loading -->
  <link rel="preconnect" href={imageCdnDomain} crossorigin="anonymous" />
  <link rel="preconnect" href={resizerDomain} crossorigin="anonymous" />
</svelte:head>

<div class="container">
  {@render children()}
</div>

<!-- Global components (lazy-loaded — only fetched when shown) -->
{#if loginStore.isPopupVisible || loginStore.isAgeConsentPopupVisible}
  {#await import('$lib/components/login/LoginPopup.svelte')}
    <div class="modal-overlay"></div>
  {:then { default: LoginPopup }}
    <LoginPopup />
  {/await}
{/if}

{#if onboardingStore.isActive}
  {#await import('$lib/components/onboarding/UserOnboarding.svelte')}
    <div class="modal-overlay"></div>
  {:then { default: UserOnboarding }}
    <UserOnboarding />
  {/await}
{/if}

<ToastContainer />

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1000;
  }
</style>
