/// <reference types="@sveltejs/kit" />

import type { AnalyticsEventActionType, EventData } from '$lib/types/analytics';

declare global {
  namespace App {
    interface Error {
      sentryId?: string;
    }
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }

  interface Window {
    Sentinel?: {
      trackEvent: (eventType: AnalyticsEventActionType, data: EventData) => void;
      _q?: unknown[];
      config?: {
        endpoint: string;
        apiKey: string;
        app: string;
        userId?: string;
        autoTrack?: Record<string, boolean>;
        batchInterval?: number;
        firstBatchDelay?: number;
        batchSize?: number;
        customContext?: Record<string, unknown>;
      };
      instance?: {
        dispose: () => void;
      };
    };
  }
}

export {};
