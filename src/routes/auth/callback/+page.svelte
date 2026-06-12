<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let error = $state<string | null>(null);
  let processing = $state(true);

  onMount(() => {
    const code = $page.url.searchParams.get('code');
    const errorParam = $page.url.searchParams.get('error');

    if (errorParam) {
      error = errorParam;
      processing = false;

      // Send error to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'google-auth-error',
            error: errorParam,
          },
          window.location.origin
        );
      }
    } else if (code) {
      // Send success to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'google-auth-success',
            code,
          },
          window.location.origin
        );
      }
    } else {
      error = 'No authorization code received';
      processing = false;
    }
  });
</script>

<div class="callback-container">
  {#if processing}
    <div class="loading">
      <div class="spinner"></div>
      <p>Completing authentication...</p>
    </div>
  {:else if error}
    <div class="error">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" stroke="#d32f2f" stroke-width="3" />
        <path d="M24 14V26M24 34H24.01" stroke="#d32f2f" stroke-width="3" stroke-linecap="round" />
      </svg>
      <h2>Authentication Failed</h2>
      <p>{error}</p>
      <button onclick={() => window.close()}>Close Window</button>
    </div>
  {/if}
</div>

<style>
  .callback-container {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: #f5f5f5;
  }

  .loading,
  .error {
    text-align: center;
    background: white;
    padding: 3rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    width: 100%;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 3px solid #f0f0f0;
    border-top-color: #333;
    border-radius: 50%;
    margin: 0 auto 1.5rem;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading p {
    margin: 0;
    color: #666;
    font-size: 1rem;
  }

  .error svg {
    margin-bottom: 1rem;
  }

  .error h2 {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    color: #333;
  }

  .error p {
    margin: 0 0 1.5rem;
    color: #666;
  }

  .error button {
    background: #333;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .error button:hover {
    opacity: 0.9;
  }
</style>
