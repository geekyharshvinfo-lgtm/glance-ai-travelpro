<script lang="ts">
  import { loginStore } from '$lib/stores/login.svelte';
  import { triggerGoogleLogin } from '$lib/utils/googleAuth';
  import { GoogleIcon } from '$lib/components/icons';

  // Function to handle custom button click
  function handleGoogleSignInClick() {
    triggerGoogleLogin();
  }
</script>

<!-- Custom Google Sign-in Button -->
<button class="google-btn" disabled={loginStore.loginInProgress} onclick={handleGoogleSignInClick}>
  {#if loginStore.loginInProgress}
    <div class="sending-spinner"></div>
    <span>SIGNING IN...</span>
  {:else}
    <GoogleIcon class="google-icon" width="20" height="20" />
    <span>CONTINUE WITH GOOGLE</span>
  {/if}
</button>

<style>
  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color 0.2s;
    background: rgba(255, 255, 255, 0.08);
    width: 320px;
    height: 56px;
    padding: 11.444px 18.311px;
    gap: 16px;
    color: #fff;
    text-align: center;
    line-height: normal;
    letter-spacing: 0.6px;
  }

  .google-btn:hover:not(:disabled) {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .google-btn:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .sending-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.3);
    border-radius: 50%;
    border-top-color: #3c4043;
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
