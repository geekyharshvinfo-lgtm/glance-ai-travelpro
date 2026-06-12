<script lang="ts">
  import { page } from '$app/state';
  import ErrorPage from '$lib/components/common/ErrorPage.svelte';

  const is404 = $derived(page.status === 404);
  const rawSlug = $derived(page.params.slug ?? '');
  const slug = $derived(rawSlug.length > 30 ? rawSlug.slice(0, 30) + '\u2026' : rawSlug);
</script>

<ErrorPage
  statusCode={page.status}
  {is404}
  label={is404 ? 'Not found' : 'Error'}
  message={is404 ? `We couldn't find "${slug}".` : 'Something went wrong loading this profile.'}
  subtitle={is404 ? 'This influencer may not exist or the link may be incorrect.' : "We're on it. Try again shortly."}
  sentryId={page.error?.sentryId}
/>
