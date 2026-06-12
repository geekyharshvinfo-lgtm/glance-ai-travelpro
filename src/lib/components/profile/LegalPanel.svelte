<script lang="ts">
  import ProfileHeader from './ProfileHeader.svelte';
  import { ArrowHalfIcon, CircleBackground, ToggleIcon, PrivacyPolicyIcon, PrivacyRightsIcon, CookieIcon } from '../icons';
  import { EXTERNAL_LINKS } from '$lib/constants/urls';
  import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
  import { trackEvent } from '$lib/utils/analytics';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  let expandedImageUrl = $state<string | null>(null);
  let analyticsCookiesEnabled = $state(true); // Toggle state for analytics cookies

  $effect(() => {
    if (isOpen) {

    }
  });

	function handleAIPrivacyPolicyClick() {
		// Track privacy policy click
		trackEvent(AnalyticsEventAction.CLICKED, {
			[ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
			[ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PRIVACY_POLICY_CLICK,
			[ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.LEGAL_PAGE,
			[ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.LEGAL,
		});

		window.open(EXTERNAL_LINKS.PRIVACY_POLICY, '_blank');
	}

	function handlePrivacyRightsClick() {
		// Track privacy rights click
		trackEvent(AnalyticsEventAction.CLICKED, {
			[ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
			[ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.PRIVACY_RIGHTS_CLICK,
			[ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.LEGAL_PAGE,
			[ANALYTICS_EVENT_KEYS.section]: SECTION_NAMES.LEGAL,
		});

		window.open(EXTERNAL_LINKS.PRIVACY_POLICY, '_blank');
	}


  function handleLooksClose() {
    onClose?.();
    expandedImageUrl = null;
  }

  function handleAnalyticsToggle(isOn: boolean) {
    analyticsCookiesEnabled = isOn;
  }
</script>

{#if isOpen}
  <div class="overlay">
    <div class="panel">
      <ProfileHeader
        onBack={handleLooksClose}
        title="Legal & Privacy"
        showBackButton={expandedImageUrl === null}
      />

			<section class="legal-menu">

				<button class="menu-item" onclick={handleAIPrivacyPolicyClick}>
					<div class="menu-icon">
						<div class="icon-container">
							<CircleBackground />
							<PrivacyPolicyIcon width={16} height={16} class="icon-overlay" />
						</div>
					</div>
					<span class="menu-text">AI Looks Global Privacy Policy</span>
					<ArrowHalfIcon width={18} height={18} />
				</button>

				<button class="menu-item" onclick={handlePrivacyRightsClick}>
					<div class="menu-icon">
						<div class="icon-container">
							<CircleBackground />
							<PrivacyRightsIcon width={16} height={16} class="icon-overlay" />
						</div>
					</div>
					<span class="menu-text">Exercise Privacy Rights</span>
					<ArrowHalfIcon width={18} height={18} />
				</button>

				<button class="menu-item">
					<div class="menu-icon">
						<div class="icon-container">
							<CircleBackground />
							<CookieIcon width={16} height={16} class="icon-overlay" />
						</div>
					</div>
				<span class="menu-text">Analytics and Personalisation cookies</span>
				<ToggleIcon isOn={analyticsCookiesEnabled} onToggle={handleAnalyticsToggle} />
			</button>

		</section>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1235;
  }

  .panel {
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
    max-width: 420px;
    height: 100%;
    background: #111;
    overflow-y: auto;
  }

	.legal-menu {
    padding: 0 16px;
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    gap: 24px;
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
		padding: 8px 16px;
		align-self: stretch;
  }

	.menu-icon {
    width: 34px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
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
		padding-right: 8px;
  }

</style>
