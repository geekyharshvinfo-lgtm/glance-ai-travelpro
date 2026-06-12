<script lang="ts">
  import { page } from '$app/state';
  import ErrorPage from '$lib/components/common/ErrorPage.svelte';

  const is404 = $derived(page.status === 404);
</script>

<ErrorPage
  statusCode={page.status}
  {is404}
  label={is404 ? 'Page not found' : 'Error'}
  message={is404 ? "This page doesn't exist — yet." : 'Something went wrong on our end.'}
  subtitle={is404 ? 'The link may be broken, or the page may have moved.' : "We're working on it. Try again in a moment."}
  sentryId={page.error?.sentryId}
/>
