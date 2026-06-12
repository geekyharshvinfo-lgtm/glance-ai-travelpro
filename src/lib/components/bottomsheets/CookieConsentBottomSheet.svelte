<script lang="ts">
  import BottomSheet from './BottomSheet.svelte';
  import { CookieIcon } from '$lib/components/icons';
  import { EXTERNAL_LINKS } from '$lib/constants/urls';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  function handleOkayGotIt() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cookieConsentAcknowledged', 'true');
    }
    onClose();
  }
</script>

<BottomSheet {isOpen} {onClose}>
  <div class="cookie-content">
    <div class="icon-container">
      <CookieIcon width={34} height={34} />
    </div>

    <h2 class="title">We ask for cookies</h2>

    <p class="description">
      We use cookies to operate this site, analyse how it is used, personalise and improve our
      services. For more details, see our <a href={EXTERNAL_LINKS.COOKIE_POLICY} target="_blank" rel="noopener noreferrer">[Cookie Policy]</a>.
    </p>

    <div class="button-container">
      <button class="action-btn primary-btn" onclick={handleOkayGotIt}>Okay, Got it</button>
    </div>
  </div>
</BottomSheet>

<style>
  .cookie-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }

  .title {
    color: #FFF;
    text-align: center;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px; /* 125% */
  }

  .description {
    margin: 0;
    max-width: 90%;
    color: rgba(255, 255, 255, 0.60);
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    letter-spacing: 0.6px;
  }

  .description a {
    color: #078BFF;
    text-decoration: underline;
  }

  .button-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin-top: 8px;
  }

  .action-btn {
    width: 100%;
    cursor: pointer;
    display: flex;
    height: 32px;
    padding: 10px 8px;
    justify-content: center;
    align-items: center;
    gap: 8px;
    align-self: stretch;
    border-radius: 4px;
    border: 1px solid transparent;
    color: white;
    text-align: center;
    font-size: 10px;
    font-style: normal;
    font-weight: 600;
    line-height: 12px; /* 120% */
    letter-spacing: 0.5px;
  }

  .action-btn.primary-btn{
    background: #FFF;
    color: #000;
  }

  .action-btn.secondary-btn{
    background:
        linear-gradient(#3a3a3a, #3a3a3a) padding-box,
        linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0.1)) border-box;
    color: #FFF;

  }
</style>
