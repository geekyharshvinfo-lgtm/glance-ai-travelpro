<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { lightbox, closeLightbox } from '$lib/stores/lightbox.svelte';

  let downloading = $state(false);

  async function download() {
    const url = lightbox.url;
    if (!url || downloading) return;
    downloading = true;
    try {
      let blobUrl = url;
      let revoke = false;
      // data: URLs can be downloaded directly; remote/object URLs are fetched to a blob.
      if (!url.startsWith('data:')) {
        const res = await fetch(url);
        const blob = await res.blob();
        blobUrl = URL.createObjectURL(blob);
        revoke = true;
      }
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `travelpro-look-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (revoke) setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    } catch {
      // Fallback: open in a new tab so the user can long-press / right-click save.
      window.open(url, '_blank');
    } finally {
      downloading = false;
    }
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') closeLightbox();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if lightbox.open && lightbox.url}
  <div
    class="lightbox"
    role="dialog"
    aria-modal="true"
    aria-label="Image viewer"
    transition:fade={{ duration: 220 }}
  >
    <button class="backdrop" aria-label="Close" onclick={closeLightbox}></button>

    <div class="lb-content" transition:scale={{ duration: 260, start: 0.94 }}>
      <img src={lightbox.url} alt={lightbox.alt} class="lb-img" />
    </div>

    <div class="lb-actions">
      <button class="lb-btn download" onclick={download} disabled={downloading}>
        {#if downloading}
          <span class="spin"></span> Saving…
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download
        {/if}
      </button>
    </div>

    <button class="lb-close" aria-label="Close viewer" onclick={closeLightbox}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
{/if}

<style>
  .lightbox {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 475px;
    margin: 0 auto;
  }

  .backdrop {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    margin: 0;
    background: rgba(6, 8, 12, 0.94);
    backdrop-filter: blur(6px);
    cursor: zoom-out;
  }

  .lb-content {
    position: relative;
    z-index: 2;
    max-width: 92%;
    max-height: 78vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lb-img {
    max-width: 100%;
    max-height: 78vh;
    object-fit: contain;
    border-radius: 0.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }

  .lb-actions {
    position: absolute;
    z-index: 3;
    bottom: 2rem;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
  }

  .lb-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 999px;
    border: none;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
  }

  .lb-btn.download {
    background: #fff;
    color: #111;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }

  .lb-btn:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .lb-close {
    position: absolute;
    z-index: 3;
    top: 1.25rem;
    right: 1.25rem;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .spin {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(0, 0, 0, 0.25);
    border-top-color: #111;
    animation: lb-spin 0.7s linear infinite;
  }

  @keyframes lb-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
