<script lang="ts">
  import { BackButton } from '$lib/components/icons';

  interface ProfileHeaderProps {
    onBack?: () => void;
    title?: string;
    showBackButton?: boolean;
  }

  let { onBack, title, showBackButton = true }: ProfileHeaderProps = $props();

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      history.back();
    }
  }
</script>

<div class="profile-header">
  {#if showBackButton}
    <button class="back-btn" onclick={handleBack}>
      <BackButton />
    </button>
  {/if}

  {#if title}
    <h1 class="profile-title" class:with-back={showBackButton}>{title}</h1>
  {/if}
</div>

<style>
  .profile-header {
    display: flex;
    align-items: center;
    padding: 20px 16px;
    position: relative;
  }

  .back-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .profile-title {
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    color: white;
    margin: 0;
    flex: 1;
  }

  .profile-title.with-back {
    margin: 0 2.5rem 0 0;
  }
</style>
