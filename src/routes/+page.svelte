<script lang="ts">
  /**
   * Root page — serves as the OAuth redirect landing page for in-app
   * WebView login. Shows a branded loading screen while the code exchange
   * happens, then navigates to the saved returnUrl.
   */
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { authService } from '$lib/services/auth';
  import { getLoginIntent, clearLoginIntent } from '$lib/services/loginIntent';
  import { loginStore } from '$lib/stores/login.svelte';
  import { onboardingStore } from '$lib/stores/onboarding.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import GlanceAILogo from '$lib/components/icons/GlanceAILogo.svelte';
  import * as Sentry from '@sentry/sveltekit';

  const DEFAULT_RETURN_URL = '/shaq';
  const AUTH_TIMEOUT_MS = 30_000;

  let isProcessing = $state(false);
  let statusText = $state('Signing you in');
  let loginFlowStarted = $state(false);

  // Fallback: if login/age-consent/onboarding all close without completeLogin
  // navigating away (user cancelled), redirect back to the influencer page.
  $effect(() => {
    if (!loginFlowStarted || !isProcessing) return;
    if (loginStore.loginInProgress) return;
    if (loginStore.isPopupVisible || loginStore.isAgeConsentPopupVisible) return;
    if (onboardingStore.isActive) return;
    if (!userStore.isLoggedIn) {
      isProcessing = false;
      clearLoginIntent();
      navigateToReturn();
    }
  });

  onMount(async () => {
    const authCode: string | undefined = $page.data.authCode;
    const authError: string | undefined = $page.data.authError;

    if (authError) {
      clearLoginIntent();
      loginStore.error = 'Authentication was cancelled or failed. Please try again.';
      navigateToReturn();
      return;
    }

    if (!authCode) return;

    isProcessing = true;
    loginStore.loginInProgress = true;
    loginStore.error = null;

    const timeout = setTimeout(() => {
      Sentry.captureMessage('OAuth redirect exchange timed out', { level: 'warning' });
      loginStore.loginInProgress = false;
      loginStore.error = 'Sign-in took too long. Please try again.';
      isProcessing = false;
      clearLoginIntent();
      navigateToReturn();
    }, AUTH_TIMEOUT_MS);

    try {
      await authService.loginWithGlance(authCode, window.location.origin);
      clearTimeout(timeout);
      loginFlowStarted = true;
      statusText = 'Setting up your experience';
    } catch (error) {
      clearTimeout(timeout);
      Sentry.captureException(error, { tags: { operation: 'oauth_redirect_exchange' } });
      loginStore.loginInProgress = false;
      loginStore.error = 'Something went wrong. Please try again.';
      isProcessing = false;
      clearLoginIntent();
      navigateToReturn();
    }
  });

  function navigateToReturn() {
    const intent = getLoginIntent();
    const returnUrl = intent?.returnUrl || DEFAULT_RETURN_URL;
    clearLoginIntent();

    import('$app/navigation').then(({ goto }) => {
      goto(returnUrl, { replaceState: true });
    });
  }
</script>

{#if isProcessing}
  <div class="auth-screen">
    <div class="auth-content">
      <div class="logo-area">
        <GlanceAILogo width={120} height={28} />
      </div>

      <div class="loader-ring"></div>

      <p class="status-text">{statusText}</p>
    </div>
  </div>
{/if}

<style>
  .auth-screen {
    position: fixed;
    inset: 0;
    background: #111111;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .auth-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    animation: fadeIn 0.4s ease-out;
  }

  .logo-area {
    opacity: 0.9;
  }

  .loader-ring {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    border: 2px solid rgba(138, 109, 255, 0.1);
    border-top-color: rgba(138, 109, 255, 0.55);
    animation: spin 0.85s linear infinite;
  }

  @keyframes spin {
    to {
      rotate: 360deg;
    }
  }

  .status-text {
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.45);
    text-align: center;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
