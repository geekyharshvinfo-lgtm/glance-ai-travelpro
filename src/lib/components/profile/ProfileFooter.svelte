<script lang="ts">
  import { GoogleIcon } from '$lib/components/icons';
  import { LOGIN_REQUIRED } from '$lib/config/env';

  interface ProfileFooterProps {
    isLoggedIn?: boolean;
    onGoogleLogin?: () => void;
    onLogout?: () => void;
  }

  let { isLoggedIn = false, onGoogleLogin, onLogout }: ProfileFooterProps = $props();

  function handleGoogleLogin() {
    if (onGoogleLogin) {
      onGoogleLogin();
    } else {
      console.log('Google login clicked');
    }
  }

  function handleLogout() {
    if (onLogout) {
      onLogout();
    } else {
      console.log('Logout clicked');
    }
  }
</script>

<div class="profile-footer">
  {#if isLoggedIn}
    <button class="logout-btn" onclick={handleLogout}>
      <span>LOGOUT</span>
    </button>
  {:else if LOGIN_REQUIRED}
    <button class="google-btn" onclick={handleGoogleLogin}>
      <GoogleIcon />
      <span>CONTINUE WITH GOOGLE</span>
    </button>
  {/if}
</div>

<style>
  .profile-footer {
    /* position: fixed;
    bottom: 40px;
    width: 90%; */
    padding: 40px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    background: #111;
  }
  .google-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    width: 320px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: white;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.6px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .google-btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .logout-btn {
    display: flex;
    width: 200px;
    height: 40px;
    padding: 15px 64px;
    justify-content: center;
    align-items: center;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.22);
    background: #fff;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .logout-btn span {
    color: #111;
    text-align: center;
    font-variant-numeric: lining-nums proportional-nums;
    font-feature-settings: 'dlig' on;
    font-size: 11px;
    font-style: normal;
    font-weight: 700;
    line-height: 140%; /* 15.4px */
    letter-spacing: 0.55px;
    text-transform: uppercase;
    opacity: 0.9;
  }

  .logout-btn:hover {
    background: rgba(255, 255, 255, 0.9);
  }
</style>
