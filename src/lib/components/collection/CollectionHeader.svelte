<script lang="ts">
  interface CollectionHeaderProps {
    slug: string;
    onBack?: () => void;
  }

  let { slug: _slug, onBack }: CollectionHeaderProps = $props();

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      history.back();
    }
  }
</script>

<div class="header">
  <button class="back-btn" aria-label="Go back" onclick={handleBack}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 18L9 12L15 6"
        stroke="white"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</div>

<style>
  .header {
    position: absolute;
    top: 1rem;
    left: 1rem;
    z-index: 20;
  }

  .back-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 0.53px solid rgba(73, 73, 73, 0);
  }
</style>
