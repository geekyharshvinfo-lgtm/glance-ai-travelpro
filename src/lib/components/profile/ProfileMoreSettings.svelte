<script lang="ts">
  import { CircleBackground, BecomeInfluencerIcon, ArrowHalfIcon } from '$lib/components/icons';
  import { userStore } from '$lib/stores/user.svelte';
  import { BecomeInfluencerBottomSheet } from '$lib/components/bottomsheets';
  import { browser } from '$app/environment';
  import { getCreatorStatus, addCreator } from '$lib/api';
  import { trackEvent } from '$lib/utils/analytics';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import DeleteIcon from '../icons/DeleteIcon.svelte';
  import DeleteAccountBottomSheet from '../bottomsheets/DeleteAccountBottomSheet.svelte';

  interface ProfileMoreSettingsProps {

  }

  let {  }: ProfileMoreSettingsProps = $props();

  let showBottomSheet = $state(false);

  function deleteAccount() {
    
    showBottomSheet = true;
  }

  function closeBottomSheet() {
    showBottomSheet = false;
  }

  
</script>

<section class="profile-settings">
  <h2 class="section-header">More Settings</h2>

  <button class="menu-item" onclick={deleteAccount}>
    <div class="menu-icon">
      <div class="icon-container">
        <CircleBackground />
        <DeleteIcon class="icon-overlay" width={14} height={14} />
      </div>
    </div>
    <span class="menu-text">Delete Account</span>
    <ArrowHalfIcon width={18} height={18} />
  </button>
</section>

{#if showBottomSheet}
  <DeleteAccountBottomSheet
    isOpen={showBottomSheet}
    onClose={closeBottomSheet}
  />

{/if}

<style>
  .profile-settings {
    padding: 0 16px;
    margin-bottom: 40px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .section-header {
    font-size: 12px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.6px;
    text-transform: uppercase;
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

  .menu-text {
    color: #fff;
    font-size: 13px;
    font-style: normal;
    font-weight: 500;
    line-height: 16.022px;
    flex-grow: 1;
  }
</style>
