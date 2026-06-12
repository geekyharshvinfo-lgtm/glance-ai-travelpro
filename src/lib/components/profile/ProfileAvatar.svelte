<script lang="ts">
  import { AvatarBackground, ProfileIcon } from '$lib/components/icons';

  interface ProfileAvatarProps {
    userAvatarUrl?: string | null | undefined;
  }

  let { userAvatarUrl }: ProfileAvatarProps = $props();
</script>

<div class="profile-avatar">
  <div class="blur-background"></div>
  <div class="avatar-container">
    {#if userAvatarUrl}
      <img src={userAvatarUrl} alt="Profile" class="avatar-image" />
    {:else}
      <div class="avatar-placeholder">
        <AvatarBackground width={82} height={82} />
        <ProfileIcon class="profile-icon-overlay" />
      </div>
    {/if}
  </div>
</div>

<style>
  .profile-avatar {
    display: flex;
    justify-content: center;
    margin: 20px 0 40px 0;
    position: relative;
  }

  .blur-background {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 50%);
    width: 80px;
    height: 31px;
    border-radius: 133.335px;
    border: 0.667px solid #000;
    opacity: 0.4;
    background: #fff;
    filter: blur(32.00032043457031px);
    z-index: 0;
  }

  .avatar-container {
    width: 76px;
    height: 77px;
    border: 0.67px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden; /* Allow content to overflow the border */
    position: relative;
    z-index: 1;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin: -2px 0.7px 0px 0px;
  }

  :global(.profile-icon-overlay) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
</style>
