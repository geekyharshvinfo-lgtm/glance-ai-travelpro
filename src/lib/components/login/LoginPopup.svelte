<script lang="ts">
  import { loginStore, closeLoginPopup, hideAgeConsentPopup } from '$lib/stores/login.svelte';
  import { authService } from '$lib/services/auth';
  import SSOLoginButton from './SSOLoginButton.svelte';
  import { startOnboarding, setOnboardingStep } from '$lib/stores/onboarding.svelte';
  import { clearPendingTryOn } from '$lib/composables/useTryOn.svelte';
  import { trackEvent } from '$lib/utils/analytics';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES } from '$lib/constants/analytics';

  const AGE_OPTIONS = [
    { value: 18, ageText: '18-24' },
    { value: 25, ageText: '25-34' },
    { value: 35, ageText: '35-44' },
    { value: 45, ageText: '45-54' },
    { value: 55, ageText: '55+' },
  ];

  let selectedAgeValue: number | null = $state(null);

  function onClose() {
    if (loginStore.loginInProgress) return;

    // Track login cancelled only if user was on login screen (not age consent)
    if (loginStore.isPopupVisible && !loginStore.isAgeConsentPopupVisible) {
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_LOGIN_CANCELLED,
        [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.AUTH_PAGE,
        [ANALYTICS_EVENT_KEYS.loginMethod]: 'google',
        [ANALYTICS_EVENT_KEYS.loginStatus]: 'cancelled',
        [ANALYTICS_EVENT_KEYS.label]: 'login_cancelled',
      });
    }

    closeLoginPopup();
    clearPendingTryOn();
  }

  function handleSkipLogin() {
    // Close popup but keep pendingTryOn intact so it resumes after selfie upload
    closeLoginPopup();
    setOnboardingStep('selfie');
    startOnboarding();
  }

  function selectAge(age: number) {
    selectedAgeValue = age;
  }

  async function updateProfileWithAge() {
    if (loginStore.loginInProgress || selectedAgeValue === null) return;

    loginStore.loginInProgress = true;

    const { success, needsOnboarding } = await authService.updateUserAge(selectedAgeValue);

    if (success) {
      closeLoginPopup();
      hideAgeConsentPopup();
      if (needsOnboarding) {
        startOnboarding(true); // true indicates it's from login flow
      }
      // else: completeLogin was already called inside updateUserAge
    } else {
      // Error is already set in the auth service
      loginStore.loginInProgress = false;
    }
  }
</script>

{#if loginStore.isPopupVisible || loginStore.isAgeConsentPopupVisible}
  <div class="overlay">
    <button class="overlay-backdrop" onclick={onClose} aria-label="Close popup"></button>
    <div class="login-wrapper">
      <div class="login-popup">
        {#if loginStore.isAgeConsentPopupVisible}
          <!-- Age Consent Content -->
          <header class="popup-header">
            <h1 class="main-title">Select Age</h1>
            <p class="subtitle">We need your age to generate your AI look</p>
          </header>

          <!-- Age selection horizontal list -->
          <div class="age-scroll-container">
            {#each AGE_OPTIONS as option (option.value)}
              <button
                class="age-btn{selectedAgeValue === option.value ? ' selected' : ''}"
                onclick={() => selectAge(option.value)}
                disabled={loginStore.loginInProgress}
              >
                {option.ageText}
              </button>
            {/each}
          </div>

          <!-- Confirm button -->
          <button
            class="confirm-btn"
            disabled={selectedAgeValue === null || loginStore.loginInProgress}
            onclick={updateProfileWithAge}
          >
            {loginStore.loginInProgress ? 'Loading...' : 'Confirm'}
          </button>

          {#if loginStore.error}
            <p class="error-message">{loginStore.error}</p>
          {/if}

          <footer class="legal-terms">
            By continuing you agree to <a href="/terms" class="legal-link">terms & conditions</a>
            and
            <a href="/privacy" class="legal-link">Privacy Policy</a>
          </footer>
        {:else}
          <!-- Login Content -->
          <header class="popup-header">
            <h1 class="main-title">Login to generate your AI look</h1>
            {#if loginStore.allowSkip}
              <p class="subtitle">Login to save your AI looks across sessions. Your selfie is only used to generate the look and won't be stored to your account.</p>
            {:else}
              <p class="subtitle">Will help us to save your details for future AI look generations</p>
            {/if}
          </header>

          <div class="sso-button-container">
            <SSOLoginButton />
          </div>

          {#if loginStore.allowSkip}
            <button class="skip-btn" onclick={handleSkipLogin}>
              Skip, continue without login
            </button>
          {/if}

          {#if loginStore.error}
            <p class="error-message">{loginStore.error}</p>
          {/if}

          <footer class="legal-terms">
            By continuing you agree to <a href="/terms" class="legal-link">terms & conditions</a>
            and
            <a href="/privacy" class="legal-link">Privacy Policy</a>
          </footer>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2222;
    display: flex;
    align-items: flex-end;
    background: rgba(0, 0, 0, 0.5);
  }

  .overlay-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    border: none;
    cursor: default;
  }

  /* Container */
  .login-wrapper {
    position: relative;
    bottom: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #333;
  }

  .login-popup {
    padding: 40px 24px;
    width: 100%;
    max-width: 400px;
    min-height: 30dvh;
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    align-items: center;
  }

  /* Wider popup for age consent */
  .login-wrapper:has(.age-scroll-container) .login-popup {
    padding: 40px 0px;
    width: 100%;
    max-width: 800px;
  }

  /* Header Section */
  .popup-header {
    margin-bottom: 24px;
    text-align: center;
  }

  .main-title {
    font-weight: 600;
    font-size: 20px;
    text-align: center;
    color: #fff;
    margin: 0 0 8px 0;
    letter-spacing: 0;
    font-style: normal;
    line-height: 140%; /* 28px */
  }

  .subtitle {
    font-weight: 400;
    font-size: 12px;
    text-align: center;
    margin: 0;
    letter-spacing: 0;
    color: rgba(255, 255, 255, 0.9);
    font-style: normal;
    line-height: 160%; /* 19.2px */
  }

  /* Button Section */
  .sso-button-container {
    margin-bottom: 24px;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  /* Footer Section */
  .legal-terms {
    font-weight: 500;
    font-size: 10px;
    line-height: 1.8;
    text-align: center;
    color: #fff;
    margin: 0;
  }

  .legal-link {
    color: #fff;
    text-decoration: underline;
  }

  /* Age Selection Styles */
  .age-scroll-container {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
    width: 100%;
    justify-content: flex-start;
    scrollbar-width: none;
    -ms-overflow-style: none;
    scroll-padding-left: 0;
    font-weight: 500;
    font-size: 16px;
    line-height: 140%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    margin: 40px 0px 10px 0px;
    padding: 0px 15px;
  }

  .age-scroll-container::-webkit-scrollbar {
    display: none;
  }

  .age-btn {
    min-width: 125px;
    height: 46px;
    border-radius: 9px;
    border: 1px solid #0000001a;
    padding: 12px 24px;
    background: #fff;
    font-weight: 500;
    font-size: 16px;
    line-height: 140%;
    letter-spacing: 0;
    text-align: center;
    vertical-align: middle;
    opacity: 1;
    cursor: pointer;
    color: #000;
    transition: all 0.2s;
  }

  .age-btn:hover:not(:disabled) {
    background: #f5f5f5;
  }

  .age-btn:active,
  .age-btn:focus {
    border-color: #888;
    border: 1px solid #000000;
    font-weight: 600;
  }

  .age-btn.selected {
    border-color: #888;
    border: 1px solid #000000;
    font-weight: 600;
    background: #f5f5f5;
  }

  .age-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .confirm-btn {
    width: 220px;
    height: 48px;
    font-weight: 700;
    font-size: 13px;
    text-align: center;
    vertical-align: middle;
    text-transform: uppercase;
    background: #000;
    color: #fff;
    border: none;
    margin: 24px 0 24px 0;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .confirm-btn:hover:not(:disabled) {
    opacity: 0.9;
  }

  .confirm-btn:disabled {
    background: #333;
    color: #fff;
    opacity: 0.7;
    cursor: not-allowed;
  }

  .skip-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding: 4px 0 16px;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .skip-btn:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  .error-message {
    color: #d32f2f;
    font-size: 12px;
    margin: 10px 0;
    text-align: center;
  }
</style>
