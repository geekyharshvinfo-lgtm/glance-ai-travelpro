<script lang="ts">
  import {
    LooksIcon,
    SelfieIcon,
    FeedbackIcon,
    CircleBackground,
    LegalPrivacyIcon,
  } from '$lib/components/icons';
  import ArrowHalfIcon from '../icons/ArrowHalfIcon.svelte';

  interface ProfileMenuProps {
    onMyLooks?: () => void;
    onUpdateSelfie?: () => void;
    onFeedback?: () => void;
    onPrivacy?: () => void;
  }

  let { onMyLooks, onUpdateSelfie, onFeedback, onPrivacy }: ProfileMenuProps = $props();

  function handleMyLooks() {
    if (onMyLooks) {
      onMyLooks();
    } else {
      console.log('Navigate to My Looks');
    }
  }

  function handleUpdateSelfie() {
    if (onUpdateSelfie) {
      onUpdateSelfie();
    } else {
      console.log('Navigate to Update Selfie');
    }
  }

  function handleFeedback() {
    if (onFeedback) {
      onFeedback();
    } else {
      console.log('Navigate to Feedback');
    }
  }

  function handlePrivacy() {
    if (onPrivacy) {
      onPrivacy();
    } else {
      console.log('Navigate to Privacy');
    }
  }
</script>

<section class="profile-menu">
  <h2 class="section-header">FEED & LOOKS</h2>

  <button class="menu-item" onclick={handleMyLooks}>
    <div class="menu-icon">
      <div class="icon-container">
        <CircleBackground />
        <LooksIcon width={17} height={15} class="icon-overlay" />
      </div>
    </div>
    <span class="menu-text">My Looks</span>
    <ArrowHalfIcon width={18} height={18} />
  </button>

  <button class="menu-item" onclick={handleUpdateSelfie}>
    <div class="menu-icon">
      <div class="icon-container">
        <CircleBackground />
        <SelfieIcon class="icon-overlay" />
      </div>
    </div>
    <span class="menu-text">Update selfie</span>
    <ArrowHalfIcon width={18} height={18} />
  </button>

  <button class="menu-item" onclick={handleFeedback}>
    <div class="menu-icon">
      <div class="icon-container">
        <CircleBackground />
        <FeedbackIcon class="icon-overlay" />
      </div>
    </div>
    <span class="menu-text">Feedback</span>
    <ArrowHalfIcon width={18} height={18} />
  </button>

  <button class="menu-item" onclick={handlePrivacy}>
    <div class="menu-icon">
      <div class="icon-container">
        <CircleBackground />
        <LegalPrivacyIcon class="icon-overlay" />
      </div>
    </div>
    <span class="menu-text">Legal & Privacy</span>
    <ArrowHalfIcon width={18} height={18} />
  </button>
</section>

<style>
  .profile-menu {
    padding: 0 16px;
    margin-bottom: 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-header {
    color: #fff;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    line-height: 16.022px; /* 133.519% */
    letter-spacing: 0.6px;
    opacity: 0.6;
  }

  .menu-item {
    display: flex;
    align-items: center;
    width: 100%;
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
  }

  .menu-icon {
    width: 34px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24px;
    flex-shrink: 0;
  }

  .icon-container {
    position: relative;
    width: 34px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.icon-overlay) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .menu-text {
    color: #fff;
    font-size: 13px;
    font-style: normal;
    font-weight: 500;
    line-height: 16.022px;
    flex-grow: 1;
  }

</style>
