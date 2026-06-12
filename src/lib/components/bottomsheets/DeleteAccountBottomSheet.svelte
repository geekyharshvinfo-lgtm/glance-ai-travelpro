<script lang="ts">
  import BottomSheet from './BottomSheet.svelte';
  import { CookieIcon } from '$lib/components/icons';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  function handleDeleteAccount() {
    onClose();
  }

	function handleCancel() {
		onClose();
	}
</script>

<BottomSheet {isOpen} {onClose}>
  <div class="content">

    <h2 class="title">Delete Account</h2>

    <p class="description">
      You won’t be able see new looks and your saved looks will be deleted
    </p>

    <div class="button-container">
      <button class="action-btn secondary-btn" onclick={handleDeleteAccount}>Delete Account</button>
      <button class="action-btn secondary-btn" onclick={handleCancel}>Cancel</button>
    </div>
  </div>
</BottomSheet>

<style>
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  .title {
    color: #FFF;
    text-align: center;
    font-size: 24px;
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
		text-transform: uppercase;
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
