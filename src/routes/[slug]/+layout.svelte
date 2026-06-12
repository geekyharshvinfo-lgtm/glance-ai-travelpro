<script lang="ts">
  import { type Snippet } from 'svelte';
  import type { LayoutData } from './$types';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';
  import { untrack } from 'svelte';

  interface Props {
    children: Snippet;
    data: LayoutData;
  }

  let { children, data }: Props = $props();
  const influencer = $derived(data.influencer);
  let prevInfluencerId: string | null = null;

  // Start background prefetch when influencer loads or changes.
  // Wait for auth initialization to ensure token is available before API calls.
  // Uses untrack for prevInfluencerId to avoid re-triggering on our own write.
  $effect(() => {
    if (!browser) return;

    // Wait for auth to be initialized before prefetching
    if (!userStore.authInitialized) return;

    const id = influencer.id;

    untrack(() => {
      if (id === prevInfluencerId) return;
      if (prevInfluencerId !== null) {
        chatStore.fullReset();
      }
      prevInfluencerId = id;
      chatStore.prefetch(id);
    });
  });

  onDestroy(() => {
    chatStore.fullReset();
  });
</script>

{@render children()}
