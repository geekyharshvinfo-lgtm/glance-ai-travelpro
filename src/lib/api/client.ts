import { API_ENDPOINTS } from '$lib/config/env';
import { userStore } from '$lib/stores/user.svelte';
import { browser } from '$app/environment';
import * as Sentry from '@sentry/sveltekit';

const API_BASE_URL = API_ENDPOINTS.AI_INFLUENCER_BACKEND;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

enum RefreshStatus {
  VALID = 'valid',
  EXPIRING_SOON = 'expiring-soon',
  EXPIRED = 'expired',
}

const DEFAULT_TIMEOUT_MS = 45000;

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

// Track ongoing refresh to prevent concurrent refresh attempts
let refreshPromise: Promise<boolean> | null = null;

/**
 * Get the current auth token (guest or Google)
 * Returns null if no token is available or if running on server
 */
function getAuthToken(): string | null {
  // Only access userStore on the client side
  if (!browser) {
    return null;
  }
  return userStore.accessToken;
}

/**
 * Check if the current token is expired or expiring soon
 * @returns 'valid' | 'expiring-soon' | 'expired'
 */
function checkTokenExpiry(): RefreshStatus {
  if (!browser || !userStore.accessTokenExpiry) {
    return RefreshStatus.VALID; // Can't check, assume valid
  }

  const now = Date.now();
  const expiresAt = userStore.accessTokenExpiry;
  const fiveMinutes = 5 * 60 * 1000;

  if (now >= expiresAt) {
    return RefreshStatus.EXPIRED;
  } else if (now >= expiresAt - fiveMinutes) {
    return RefreshStatus.EXPIRING_SOON;
  } else {
    return RefreshStatus.VALID;
  }
}

/**
 * Refresh auth token with deduplication
 * @returns Promise resolving to whether refresh was successful
 */
async function refreshAuthToken(): Promise<boolean> {
  // If already refreshing, wait for that promise
  if (refreshPromise) {
    return await refreshPromise;
  }

  // Start new refresh
  refreshPromise = (async () => {
    try {
      const { authService } = await import('$lib/services/auth');
      return await authService.refreshToken();
    } catch (error) {
      console.error('[API Client] Token refresh error:', error);
      Sentry.captureException(error, { tags: { operation: 'api_token_refresh' } });
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return await refreshPromise;
}

async function request<T>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {},
  fetchFn: typeof fetch = fetch
): Promise<T> {
  // Check and refresh token if needed (only on client side)
  if (browser) {
    const tokenStatus = checkTokenExpiry();
    if (tokenStatus === RefreshStatus.EXPIRED || tokenStatus === RefreshStatus.EXPIRING_SOON) {
      console.log(`[API Client] Token ${tokenStatus}, refreshing...`);
      const refreshed = await refreshAuthToken();
      if (!refreshed) {
        console.warn('[API Client] Token refresh failed, proceeding with current token');
      }
    }
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Auto-attach Authorization header if token is available
  const authToken = getAuthToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    method,
    headers,
    signal: options.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  };

  if (options.body && method !== 'GET') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetchFn(url, config);

  // Handle 401 by attempting token refresh (fallback)
  if (response.status === 401 && browser) {
    console.log('[API Client] Got 401, attempting token refresh...');
    const refreshed = await refreshAuthToken();

    if (refreshed) {
      // Retry the original request with new token
      console.log('[API Client] Token refreshed, retrying request');
      const newAuthToken = getAuthToken();
      if (newAuthToken) {
        headers['Authorization'] = `Bearer ${newAuthToken}`;
      }

      const retryConfig: RequestInit = {
        method,
        headers,
        signal: options.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      };

      if (options.body && method !== 'GET') {
        retryConfig.body = JSON.stringify(options.body);
      }

      const retryResponse = await fetchFn(url, retryConfig);

      if (!retryResponse.ok) {
        throw new ApiError(
          retryResponse.status,
          `Request failed with status ${retryResponse.status}`
        );
      }

      const retryData: T = await retryResponse.json();
      if (!retryData) {
        throw new ApiError(retryResponse.status, 'API returned an error response');
      }
      return retryData;
    } else {
      // Refresh failed, throw auth error
      throw new ApiError(401, 'Authentication expired');
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data: T = await response.json();
  if (!data) {
    throw new ApiError(response.status, 'API returned an error response');
  }

  return data;
}

export const api = {
  get<T>(endpoint: string, options?: RequestOptions, fetchFn?: typeof fetch): Promise<T> {
    return request<T>('GET', endpoint, options, fetchFn);
  },

  post<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
    fetchFn?: typeof fetch
  ): Promise<T> {
    return request<T>('POST', endpoint, { ...options, body }, fetchFn);
  },

  put<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
    fetchFn?: typeof fetch
  ): Promise<T> {
    return request<T>('PUT', endpoint, { ...options, body }, fetchFn);
  },

  patch<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions,
    fetchFn?: typeof fetch
  ): Promise<T> {
    return request<T>('PATCH', endpoint, { ...options, body }, fetchFn);
  },

  delete<T>(endpoint: string, options?: RequestOptions, fetchFn?: typeof fetch): Promise<T> {
    return request<T>('DELETE', endpoint, options, fetchFn);
  },
};
