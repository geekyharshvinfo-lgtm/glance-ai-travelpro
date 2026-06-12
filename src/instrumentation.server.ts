import * as Sentry from '@sentry/sveltekit';
import { SENTRY_DSN, SENTRY_ENVIRONMENT } from '$lib/config/env';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0,

    enableLogs: true,
  });
}
