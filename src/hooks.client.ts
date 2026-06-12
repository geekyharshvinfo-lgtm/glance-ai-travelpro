import { handleErrorWithSentry, replayIntegration } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { SENTRY_DSN, SENTRY_ENVIRONMENT } from '$lib/config/env';

const isProduction = SENTRY_ENVIRONMENT === 'production';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,

    tracesSampleRate: isProduction ? 0.1 : 1.0,

    enableLogs: true,

    // Replay adds ~50KB — only load in non-production environments
    replaysSessionSampleRate: isProduction ? 0 : 0.1,
    replaysOnErrorSampleRate: isProduction ? 0 : 1.0,

    integrations: isProduction
      ? []
      : [
          replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],

    sendDefaultPii: false,
  });
}

export const handleError = handleErrorWithSentry();
