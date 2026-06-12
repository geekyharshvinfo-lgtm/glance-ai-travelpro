import { sequence } from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import type { Handle } from '@sveltejs/kit';

// Sentry is initialized in instrumentation.server.ts — sentryHandle() reuses that instance
export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {
  const response = await resolve(event);

  // Immutable assets (content-hashed filenames) — cache forever
  if (event.url.pathname.startsWith('/_app/immutable/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');

  return response;
});

export const handleError = Sentry.handleErrorWithSentry();
