<script lang="ts">
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { showLoginPopup } from '$lib/stores/login.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import { authService } from '$lib/services/auth';
  import { EXTERNAL_LINKS, EMAIL_LINKS } from '$lib/constants/urls';
  import { triggerGoogleLogin } from '$lib/utils/googleAuth';
  import ProfileHeader from './ProfileHeader.svelte';
  import ProfileAvatar from './ProfileAvatar.svelte';
  import ProfileMenu from './ProfileMenu.svelte';
  import ProfileFooter from './ProfileFooter.svelte';
  import MyLooksPanel from './MyLooksPanel.svelte';
  import ProfileCreator from './ProfileCreator.svelte';
  import { trackEvent } from '$lib/utils/analytics';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, PERFORMANCE_EVENT_ACTIONS, SECTION_NAMES } from '$lib/constants/analytics';
  import { onMount } from 'svelte';
  import ProfileMoreSettings from './ProfileMoreSettings.svelte';
  import LegalPanel from './LegalPanel.svelte';

  interface ProfileDropdownProps {
    isOpen: boolean;
    onUpdateSelfie?: () => void;
    onClose?: () => void;
  }

  let { isOpen, onUpdateSelfie, onClose }: ProfileDropdownProps = $props();

  let isMyLooksOpen = $state(false);
  let isLegalPanelOpen = $state(false);

  // Prevent background scroll when profile dropdown is open
  $effect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Disable background scroll
      // Track profile page open event
      trackEvent(AnalyticsEventAction.RENDERED, {
        [ANALYTICS_EVENT_KEYS.action]: PERFORMANCE_EVENT_ACTIONS.PROFILE_OPENED,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PERFORMANCE,
        [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE
      });
    } else {
      document.body.style.overflow = ''; // Re-enable background scroll
    }
    return () => {
      document.body.style.overflow = ''; // Clean up on unmount
    };
  });

  function handleUpdateSelfie() {
    // Track update selfie click
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.UPDATE_SELFIE_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.PROFILE,
      [ANALYTICS_EVENT_KEYS.label]: 'update_selfie',
    });
    
    handleClose(); // Close the panel first
    onUpdateSelfie?.();
  }

  function handleClose() {
    // Track profile close
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: PERFORMANCE_EVENT_ACTIONS.PROFILE_CLOSED,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PROFILE_BACK_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.PROFILE,
      [ANALYTICS_EVENT_KEYS.label]: 'close_profile',
    });
    
    onClose?.();
  }

  function handleLooksClose() {
    isMyLooksOpen = false;
  }

  function handleGoogleLogin() {
    // Track Google login click
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.GOOGLE_LOGIN_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.PROFILE,
      [ANALYTICS_EVENT_KEYS.label]: 'google_login',
    });
    
    handleClose(); // Close the profile dropdown
    showLoginPopup(); // Show the login popup which contains SSO button
    triggerGoogleLogin();
  }

  function handleLogout() {
    // Track logout click
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.LOGOUT_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.PROFILE,
      [ANALYTICS_EVENT_KEYS.label]: 'logout',
    });
    
    authService.logout();
    handleClose();
  }

  function handleFeedback() {
    // Track feedback click
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.FEEDBACK_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.PROFILE,
      [ANALYTICS_EVENT_KEYS.label]: 'feedback',
    });
    
    window.location.href = `mailto:${EMAIL_LINKS.FEEDBACK}?subject=AI Looks Feedback`;
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

  function handleMyLooks() {
    // Track My Looks click
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.MY_LOOKS_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.PROFILE,
      [ANALYTICS_EVENT_KEYS.label]: 'my_looks',
    });
    
    // handleClose(); // Close the profile dropdown
    isMyLooksOpen = true;
  }

  function handlePrivacy() {
    // Track privacy policy click
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PRIVACY_POLICY_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.PROFILE,
      [ANALYTICS_EVENT_KEYS.label]: 'privacy_policy',
    });
    
    isLegalPanelOpen = true;
    // window.open(EXTERNAL_LINKS.PRIVACY_POLICY, '_blank');
  }

  function handleLegalPanelClose() {
    isLegalPanelOpen = false;
  }
</script>

{#if isOpen}
  <div class="profile-overlay" transition:fade={{ duration: 300 }}>
    <div class="profile-panel" in:slideIn out:slideOut>
      <!-- Profile Header -->
      <ProfileHeader onBack={handleClose} title="Profile" />

      <!-- Profile Avatar -->
      <ProfileAvatar userAvatarUrl={userStore.profileImage} />

      <!-- Options Sections. -->
      <div class="options-container">
        <!-- Feed & Looks Menu -->
        <ProfileMenu
          onMyLooks={handleMyLooks}
          onUpdateSelfie={handleUpdateSelfie}
          onFeedback={handleFeedback}
          onPrivacy={handlePrivacy}
        />

        <!-- Settings Menu -->
        <ProfileCreator isLoggedIn={userStore.isLoggedIn} />

        <!-- More Settings -->
        <!-- <ProfileMoreSettings /> -->

        <!-- Login/Logout Button -->
        <ProfileFooter
          isLoggedIn={userStore.isLoggedIn}
          onGoogleLogin={handleGoogleLogin}
          onLogout={handleLogout}
        />
      </div>
    </div>
  </div>
{/if}

<MyLooksPanel isOpen={isMyLooksOpen} onClose={handleLooksClose} />
<LegalPanel isOpen={isLegalPanelOpen} onClose={handleLegalPanelClose} />

<style>
  .profile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1234;
  }

  .profile-panel {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #111;
    color: white;
    margin: 0 auto;
  }

  .options-container {
    padding: 0px 20px 20px 20px;
    overflow-x: auto;
  }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .profile-panel {
      max-width: 100%;
    }
  }
</style>
