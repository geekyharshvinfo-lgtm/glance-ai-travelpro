<script lang="ts">
  import type { InfluencerResponse } from '$lib/types';
  import { TwitterIcon, InstagramIcon, LinkedInIcon, YoutubeIcon } from '../icons';

  let { footerData }: { footerData: InfluencerResponse['footerData'] } = $props();

  function handleAppStoreClick() {
    window.open(footerData.oneLinkUrl, '_blank');
  }

  function handlePlayStoreClick() {
    window.open(footerData.oneLinkUrl, '_blank');
  }

  function handleSocialClick(url: string) {
    window.open(url, '_blank');
  }
</script>

<footer class="footer">
  <div class="footer-content">
    <div class="footer-badges">
      <p class="footer-badge-text">Download from</p>
      <button class="footer-badge-button" onclick={handlePlayStoreClick}>
        <img
          src="https://x-stg.glance-cdn.com/public/content/assets/other/google-play-icon.png"
          alt="Play Store"
          class="footer-badge"
        />
      </button>

      <button class="footer-badge-button" onclick={handleAppStoreClick}>
        <img
          src="https://x-stg.glance-cdn.com/public/content/assets/other/app-store-icon.png"
          alt="App Store"
          class="footer-badge"
        />
      </button>
      <p class="footer-badge-copyright">{footerData.copyrightText}</p>
    </div>
    <div class="footer-links">
      <a href={footerData.privacyPolicyLink} class="footer-link">Privacy Policy</a>
      <a href={footerData.termsOfServiceLink} class="footer-link">Terms of Service</a>
      <div class="footer-socials">
        <button class="footer-social" onclick={() => handleSocialClick(footerData?.instagramLink)}>
          <InstagramIcon />
        </button>
        <button class="footer-social" onclick={() => handleSocialClick(footerData?.linkedInLink)}>
          <LinkedInIcon />
        </button>
        <button class="footer-social" onclick={() => handleSocialClick(footerData?.youtubeLink)}>
          <YoutubeIcon />
        </button>
      </div>
    </div>
  </div>
</footer>

<style>
  .footer {
    background: rgba(51, 51, 51, 1);
    padding: 1.5rem 1.25rem;
    color: white;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .footer-badges {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .footer-badge {
    width: 5.625rem;
  }

  .footer-badge-button {
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: opacity 0.2s ease;
  }

  .footer-badge-button:hover {
    opacity: 0.8;
  }

  .footer-badge-text {
    font-weight: 500;
    font-size: 0.625rem;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
  }

  .footer-badge-copyright {
    font-weight: 500;
    font-size: 1rem;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: center;
    margin-top: 1.25rem;
  }

  .footer-links {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 1rem;
  }

  .footer-link {
    color: white;
    font-weight: 500;
    font-size: 1rem;
    line-height: 100%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    text-decoration: none;
  }

  .footer-link:hover {
    color: white;
  }

  .footer-socials {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .footer-social {
    background: transparent;
  }
</style>
