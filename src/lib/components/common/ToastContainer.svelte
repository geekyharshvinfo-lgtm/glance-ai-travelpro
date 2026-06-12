<script lang="ts">
  import Toast from '$components/common/Toast.svelte';
  import { toastStore } from '$lib/stores/toast.svelte';

  const toasts = $derived(toastStore.toasts);
</script>

<div class="toast-container">
  {#each toasts as toast, index (toast.id)}
    <div class="toast-wrapper" style="top: {index * 80}px">
      <Toast
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onClose={() => toastStore.remove(toast.id)}
      />
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    z-index: 99999;
  }

  .toast-wrapper {
    position: absolute;
    left: 10%;
    right: 10%;
    transition: top 0.3s ease-out;
    pointer-events: auto;
  }
</style>
