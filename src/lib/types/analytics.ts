export type AnalyticsEventActionType =
  | 'CLICKED'
  | 'RENDERED'
  | 'VIEWED'
  | 'WEB_VITAL'
  | 'JS_ERROR'
  | 'SCROLL'
  | 'PING'
  | 'SESSION_END'
  | 'SESSION_START'
  | 'FOCUS'
  | 'OUT_OF_FOCUS'
  | 'SWIPE'
  | 'API_REQUEST'
  | 'PAGE_START'
  | 'PAGE_END'
  | 'DOM_CONTENT_LOADED'
  | 'PAGE_LOAD'
  | 'MESSAGE_RECEIVED';

/**
 * Configuration for element view tracking
 */
export type ViewConfig = {
  threshold?: number;
  once?: boolean;
};

export interface EventData {
  pageName?: string;
  component?: string;
  section?: string;
  position?: string;
  contentId?: string;
  action?: string;
  eventType?: string;
  [key: string]: unknown;
}

/**
 * Core tracking configuration interface
 */
export type TrackingConfig = {
  track?: {
    click?: boolean;
    view?: boolean | ViewConfig;
  };
} & EventData;

/**
 * Custom context data for Sentinel configuration
 * Contains page metadata and user information
 */
export type CustomContext = {
  extras?: Record<string, unknown>;
  pageName?: string;
  eventType?: string;
  url?: string;
  referrer?: string;
  [key: string]: unknown;
};
