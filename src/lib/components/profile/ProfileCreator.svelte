<script lang="ts">
  import { CircleBackground, BecomeInfluencerIcon } from '$lib/components/icons';
  import { userStore } from '$lib/stores/user.svelte';
  import { BecomeInfluencerBottomSheet } from '$lib/components/bottomsheets';
  import { browser } from '$app/environment';
  import { getCreatorStatus, addCreator } from '$lib/api';
  import { trackEvent } from '$lib/utils/analytics';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import ArrowHalfIcon from '../icons/ArrowHalfIcon.svelte';

  interface ProfileCreatorProps {
    isLoggedIn?: boolean;
  }

  let { isLoggedIn = false }: ProfileCreatorProps = $props();

  let showBottomSheet = $state(false);
  let isBecomeInfluencerSubmitted = $state(false);
  let hasSubmittedBefore = $state(false);
  const HIDE_BOTTOMSHEET_DELAY = 5000; // 5 seconds

  $effect(() => {
    // Check localStorage for becomeInfluencerData and matching userId on component mount
    checkApplicationStatus();
  });

  async function checkApplicationStatus() {
    if (!browser) return;

    const storedData = localStorage.getItem('becomeInfluencerData');
    if (!storedData) return;

    try {
      const parsed = JSON.parse(storedData);
      const currentUserId = isLoggedIn ? userStore.accountId : getStoredGuestUserID();

      // Check if stored data matches current user
      if (parsed.userId && parsed.userId === currentUserId) {
        // Verify status via API
        if (parsed.instaHandle) {
          try {
            const statusResponse = await getCreatorStatus(parsed.instaHandle);
            if (statusResponse && statusResponse.approvalStatus) {
              // User has an active application
              hasSubmittedBefore = true;
            } else {
              // No active application found, clear localStorage
              localStorage.removeItem('becomeInfluencerData');
              hasSubmittedBefore = false;
            }
          } catch (error) {
            // If API fails, fall back to localStorage check
            console.error('Error checking creator status:', error);
            hasSubmittedBefore = true;
          }
        } else {
          // No Instagram handle stored, just use localStorage
          hasSubmittedBefore = true;
        }
      }
    } catch (e) {
      console.error('Error parsing localStorage data:', e);
    }
  }

  function becomeInfluencer() {
    // Track become influencer click
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.BECOME_INFLUENCER_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.PROFILE,
      [ANALYTICS_EVENT_KEYS.label]: 'become_influencer',
    });
    
    showBottomSheet = true;
  }

  function closeBottomSheet() {
    showBottomSheet = false;
    isBecomeInfluencerSubmitted = false;
  }

  async function handleBecomeInfluencerSubmit(
    name: string,
    email: string,
    instaHandle: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await addCreator({
        name,
        email,
        instagramHandle: instaHandle,
      });
      console.log('addCreator response:', response);
      if (response && response.approvalStatus) {
        // API call successful
        isBecomeInfluencerSubmitted = true;
        hasSubmittedBefore = true;
        storeToLocalStorage(name, email, instaHandle);
        setTimeout(() => {
          closeBottomSheet();
        }, HIDE_BOTTOMSHEET_DELAY);
        return { success: true };
      } else {
        return { success: false, error: 'Failed to submit application. Please try again.' };
      }
    } catch (error) {
      console.error('Error submitting creator application:', error);
      // Handle API errors gracefully
      // Check status api if submission fails to determine if user has an active application
      if (instaHandle) {
        try {
          const statusResponse = await getCreatorStatus(instaHandle);
          if (statusResponse && statusResponse.approvalStatus) {
            hasSubmittedBefore = true;
            return {
              success: false,
              error:
                'You have already submitted an application. Please wait for it to be reviewed.',
            };
          } else {
            return { success: false, error: 'Failed to submit application. Please try again.' };
          }
        } catch (statusError) {
          console.error('Error checking creator status after submission failure:', statusError);
          return {
            success: false,
            error: 'Failed to submit application and check status. Please try again later.',
          };
        }
      } else {
        return { success: false, error: 'An error occurred. Please try again later.' };
      }
    }
  }

  function getStoredGuestUserID(): string | null {
    if (!browser) return null; // Ensure this runs only in the browser
    const storedData = localStorage.getItem('ai_influencer_guest_token');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        return parsed.userId || null;
      } catch {
        // ignore parse errors
      }
    }
    return null;
  }

  function storeToLocalStorage(name: string, email: string, instaHandle: string) {
    let userId;
    if (isLoggedIn) {
      userId = userStore.accountId;
    } else {
      const guestToken = getStoredGuestUserID();
      userId = guestToken || null;
    }
    const userData = {
      name,
      email,
      instaHandle,
      userId,
    };
    localStorage.setItem('becomeInfluencerData', JSON.stringify(userData));
  }
</script>

<section class="profile-settings">
  <h2 class="section-header">Creator Options</h2>

  <button class="menu-item become-creator" onclick={becomeInfluencer}>
    <div class="menu-icon">
      <div class="icon-container">
        <CircleBackground />
        <BecomeInfluencerIcon class="icon-overlay" width={14} height={14} />
      </div>
    </div>
    <span class="menu-text become-creator-text">Become a Creator</span>
    <ArrowHalfIcon width={18} height={18} />
  </button>

  <!-- <button class="menu-item access-creator-studio">
    <div class="menu-icon">
      <div class="icon-container">
        <CircleBackground />
        <CreatorStudioIcon class="icon-overlay" />
      </div>
    </div>
    <span class="menu-text access-creator-studio-text">Access Creator Studio</span>
    <svg class="menu-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18l6-6-6-6"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button> -->
</section>

{#if showBottomSheet}
  <BecomeInfluencerBottomSheet
    isOpen={showBottomSheet}
    isSubmitted={isBecomeInfluencerSubmitted}
    {hasSubmittedBefore}
    onClose={closeBottomSheet}
    onSubmit={handleBecomeInfluencerSubmit}
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
