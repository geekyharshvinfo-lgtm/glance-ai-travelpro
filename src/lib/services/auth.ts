/**
 * Authentication service for Google OAuth and token management
 */

import {
  userStore,
  setAuthTokens,
  setUserProfile,
  clearAuth,
  setGuestAuth,
  setAuthInitialized,
} from '$lib/stores/user.svelte';
import { resetAllTryOn } from '$lib/stores/tryOnStore.svelte';
import { clearPendingTryOn } from '$lib/composables/useTryOn.svelte';
import { clearChatTryOnQueue } from '$lib/stores/chatTryOnQueue.svelte';
import {
  loginStore,
  closeLoginPopup,
  setLoginTokenData,
  setLoginInProgress,
  setLoginError,
  showAgeConsentPopup,
} from '$lib/stores/login.svelte';
import { getLoginIntent, clearLoginIntent, setRestoredAction } from '$lib/services/loginIntent';
import { AUTH_CLIENT_ID, API_ENDPOINTS } from '$lib/config/env';
import { getGuestChatCacheKey } from '$lib/constants/storage';
import { browser } from '$app/environment';
import { trackEvent } from '$lib/utils/analytics';
import {
  ACTION_TYPES,
  ANALYTICS_EVENT_KEYS,
  AnalyticsEventAction,
  EVENT_TYPES,
  PAGE_NAMES,
} from '$lib/constants/analytics';
import * as Sentry from '@sentry/sveltekit';

const ACCESS_TOKEN_EXPIRY_MS = 3_600_000; // 1 hour
const REFRESH_TOKEN_EXPIRY_MS = 2_592_000_000; // 30 days

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
  user?: {
    accountId: string;
    profileId: string;
    email: string;
    name: string;
    profileImage: string;
    age?: number;
  };
}

interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface UserProfileData {
  message?: string;
  profileId?: string;
  gender?: string;
  bodyType?: string;
  imageUrl?: string;
}

class AuthService {
  private initialized = false;

  private get isBrowser() {
    return browser;
  }

  /**
   * Initialize the auth service
   */
  async initialize() {
    if (this.initialized || !this.isBrowser) {
      return;
    }

    // Check for existing Google auth tokens in localStorage
    const accessToken = this.getStoredAccessToken();
    const refreshToken = this.getStoredRefreshToken();

    if (accessToken && refreshToken) {
      // Get stored expiry timestamps
      const accessTokenExpiry = this.getStoredAccessTokenExpiry();
      const refreshTokenExpiry = this.getStoredRefreshTokenExpiry();

      // Sync Google tokens from localStorage to store
      // Profile data is auto-hydrated by the user store's init block
      setAuthTokens(accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry);
    } else {
      // No Google auth found - try guest login
      console.log('[Auth] No Google tokens found, attempting guest login');

      // Check for existing guest token
      const storedGuestToken = this.getStoredGuestToken();

      if (storedGuestToken) {
        // Use cached guest token
        console.log('[Auth] Using cached guest token');
        const tokenData = this.parseStoredGuestToken(storedGuestToken);
        if (tokenData) {
          setGuestAuth(tokenData.accessToken, tokenData.expiresIn, tokenData.userId);
        } else {
          // Expired — fetch a new guest token
          const guestResponse = await this.loginAsGuest(userStore.deviceId);
          if (guestResponse) {
            console.log('[Auth] Guest login successful (after expired token)');
            setGuestAuth(guestResponse.accessToken, guestResponse.expiresIn, guestResponse.userId);
            this.storeGuestToken(guestResponse);
          } else {
            console.warn('[Auth] Guest login failed (after expired token)');
          }
        }
      } else {
        // Call guest login API with deviceId
        const guestResponse = await this.loginAsGuest(userStore.deviceId);

        if (guestResponse) {
          console.log('[Auth] Guest login successful');
          setGuestAuth(guestResponse.accessToken, guestResponse.expiresIn, guestResponse.userId);
          this.storeGuestToken(guestResponse);
        } else {
          console.warn('[Auth] Guest login failed');
        }

        // Clear stale try-on data only for brand-new guest sessions (no prior token).
        // Returning guests with a cached token are resuming an existing session
        // their pending generations should be preserved.
        resetAllTryOn();
      }
    }

    // Signal that auth initialization completed (even on failure) so that
    // authReady resolves and downstream consumers like chat prefetch unblock.
    setAuthInitialized();
    this.initialized = true;
  }

  /**
   * Exchange Google auth code for tokens (matches glance-ai-embed)
   */
  async loginWithGlance(
    authCode: string,
    redirectUri: string = window?.location?.origin
  ): Promise<void> {
    try {
      setLoginInProgress(true);
      // Construct URL parameters as per glance-ai-embed
      // Use environment-specific client ID
      const urlParams = new URLSearchParams({
        code: authCode,
        client_id: AUTH_CLIENT_ID, // Environment-based client ID
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      });

      const response = await fetch(
        `${API_ENDPOINTS.GLANCE_ACCOUNT}/api/v0/login/google?${urlParams.toString()}`,
        {
          method: 'POST',
          headers: {
            Accept: '*/*',
            'Content-Length': '0',
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Glance authentication failed:', error);

        // Track login failed
        trackEvent(AnalyticsEventAction.CLICKED, {
          [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
          [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_LOGIN_FAILED,
          [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.AUTH_PAGE,
          [ANALYTICS_EVENT_KEYS.loginMethod]: 'google',
          [ANALYTICS_EVENT_KEYS.loginStatus]: 'failed',
          [ANALYTICS_EVENT_KEYS.errorMessage]: 'Glance authentication failed',
          [ANALYTICS_EVENT_KEYS.label]: 'glance_auth_failed',
        });

        throw new Error('Failed to authenticate with Glance');
      }

      const authData: AuthResponse = await response.json();

      // Compute expiry fallbacks once
      const accessTokenExpiry = authData.accessTokenExpiry || Date.now() + ACCESS_TOKEN_EXPIRY_MS;
      const refreshTokenExpiry =
        authData.refreshTokenExpiry || Date.now() + REFRESH_TOKEN_EXPIRY_MS;

      // Store tokens temporarily in login store
      setLoginTokenData({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      });

      // Check if user needs to set age by getting account info
      try {
        const accountInfo = await this.getAccountInfo(authData.accessToken);

        if (accountInfo.success && accountInfo.data) {
          const userProfile = {
            accountId: accountInfo.data.accountId || '',
            profileId: accountInfo.data.profileId || '',
            email: accountInfo.data.email || '',
            name: accountInfo.data.name || '',
            profileImage: accountInfo.data.profileImage || '',
            age: accountInfo.data.age,
          };

          // Sync profile to reactive store — localStorage is auto-persisted by the $effect
          setUserProfile(userProfile);

          if (accountInfo.data.age) {
            // User already has age set, complete login
            await this.completeLogin({
              accessToken: authData.accessToken,
              refreshToken: authData.refreshToken,
              accessTokenExpiry,
              refreshTokenExpiry,
              user: userProfile,
            });
          } else {
            // User needs to set age - but we've already cached the profile
            setLoginInProgress(false);
            showAgeConsentPopup();
          }
        } else {
          // User needs to set age
          setLoginInProgress(false);
          showAgeConsentPopup();
        }
      } catch (error) {
        console.error('Failed to check user profile:', error);
        // Show age consent popup as fallback
        setLoginInProgress(false);
        showAgeConsentPopup();
      }
    } catch (error) {
      console.error('Auth error:', error);

      // Track login failed
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_LOGIN_FAILED,
        [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.AUTH_PAGE,
        [ANALYTICS_EVENT_KEYS.loginMethod]: 'google',
        [ANALYTICS_EVENT_KEYS.loginStatus]: 'failed',
        [ANALYTICS_EVENT_KEYS.errorMessage]:
          error instanceof Error ? error.message : 'Authentication failed',
        [ANALYTICS_EVENT_KEYS.label]: 'login_error',
      });

      Sentry.captureException(error, { tags: { operation: 'login_with_glance' } });
      setLoginInProgress(false);
      setLoginError(error instanceof Error ? error.message : 'Authentication failed');
    }
  }

  /**
   * Complete the login process
   * @param authData - Auth tokens and user profile data
   * @param options.skipChatMigrate - Skip chat migration (e.g., when called from onboarding which handles it via the onboard API)
   */
  async completeLogin(authData: AuthResponse, options?: { skipChatMigrate?: boolean }) {
    // Clear guest token when upgrading to Google auth
    this.clearStoredGuestToken();

    // Store tokens in both localStorage and svelte store
    this.storeTokens(
      authData.accessToken,
      authData.refreshToken,
      authData.accessTokenExpiry,
      authData.refreshTokenExpiry
    );
    setAuthTokens(
      authData.accessToken,
      authData.refreshToken,
      authData.accessTokenExpiry,
      authData.refreshTokenExpiry
    );

    if (authData.user) {
      setUserProfile({
        accountId: authData.user.accountId,
        profileId: authData.user.profileId,
        email: authData.user.email,
        name: authData.user.name,
        profileImage: authData.user.profileImage,
        ...(authData.user.age ? { age: authData.user.age } : {}),
      });

      Sentry.setUser({
        id: authData.user.profileId,
        email: authData.user.email,
        username: authData.user.name,
      });
      Sentry.setTag('auth_type', 'google');
    }

    // Fetch user profile for onboarding data (may update profileId)
    try {
      const userProfileResult = await this.getUserProfile(authData.accessToken);
      if (userProfileResult.success && userProfileResult.data) {
        this.applyUserProfileData(userProfileResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }

    // Migrate guest chat conversation to authenticated user
    if (!options?.skipChatMigrate) {
      await this.migrateChatConversation();
    }

    // Reset login state
    closeLoginPopup();

    // Track login success
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_LOGIN_SUCCESS,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.AUTH_PAGE,
      [ANALYTICS_EVENT_KEYS.loginMethod]: 'google',
      [ANALYTICS_EVENT_KEYS.loginStatus]: 'success',
      [ANALYTICS_EVENT_KEYS.userId]: authData.user?.accountId || '',
      [ANALYTICS_EVENT_KEYS.label]: 'login_success',
    });

    // Sync cookies with final profile state and re-fetch server data
    this.setProfileCookies(userStore.profileId || '', userStore.accountId || '');

    // Clear guest try-on results so the SSR-returned ai_look (for the logged-in
    // user's selfie) takes over instead of the stale in-memory guest result.
    resetAllTryOn();

    // If this login was triggered via an OAuth redirect (in-app WebView),
    // navigate back to the original page. Clear the sessionStorage intent
    // immediately to prevent stale re-reads; relay the action in-memory
    // so useTryOn's $effect can consume it after the page mounts.
    const intent = getLoginIntent();
    clearLoginIntent();
    if (intent) {
      if (intent.action) setRestoredAction(intent.action);
      const { goto } = await import('$app/navigation');
      await goto(intent.returnUrl || '/dinah-saurr', { replaceState: true, invalidateAll: true });
    } else {
      import('$app/navigation').then(({ invalidateAll }) => invalidateAll());
    }
  }

  /**
   * Migrate guest chat conversation to authenticated user.
   * Sends the current guest conversation path so the backend can
   * transfer ownership and return a new path + Firebase token.
   */
  private async migrateChatConversation() {
    try {
      const { chatStore } = await import('$lib/stores/chatStore.svelte');
      const influencerId =
        chatStore.influencerId || (browser ? localStorage.getItem('influencer_id') || '' : '');

      // In the popup flow, chatStore is initialized and messagesPath is available.
      // In the redirect flow (in-app WebView), the chat page isn't mounted, so
      // messagesPath is null. Fall back to the guest conversation cache in
      // localStorage which was written during the original guest chat init.
      let currentPath = chatStore.messagesPath;
      if (!currentPath && browser && influencerId) {
        try {
          const cached = localStorage.getItem(getGuestChatCacheKey(influencerId));
          if (cached) {
            const data = JSON.parse(cached);
            currentPath = data.path || null;
          }
        } catch {
          // Ignore parse errors
        }
      }

      if (!currentPath || !influencerId || !userStore.profileId) {
        console.log('[Auth] Skipping chat migration — no active conversation or missing profileId');
        return;
      }

      // Strip /messages suffix to get the conversation path
      const conversationPath = currentPath.trim().replace(/\/messages$/, '');
      console.log('[Auth] Migrating chat conversation:', {
        conversationPath,
        influencerId,
        profileId: userStore.profileId,
      });

      const { migrateChat } = await import('$lib/api/chat');
      const result = await migrateChat(influencerId, {
        profileId: userStore.profileId,
        path: conversationPath,
      });

      console.log('[Auth] Chat migration successful:', { newPath: result.path });

      // Clean up the guest conversation cache so it isn't reused
      if (browser) {
        localStorage.removeItem(getGuestChatCacheKey(influencerId));
      }

      // Soft reset and reinitialize with the migrated conversation path/token.
      chatStore.migrateToPath(influencerId, result.path, result.token);
    } catch (error) {
      console.error('[Auth] Chat migration failed:', error);
      Sentry.captureException(error, { tags: { operation: 'chat_migration' } });
      // Non-fatal — chat will reinitialize on next visit
    }
  }

  /**
   * Update user profile with age
   */
  async updateUserAge(age: number): Promise<{ success: boolean; needsOnboarding: boolean }> {
    const tokenData = loginStore.loginTokenData;
    if (!tokenData) {
      setLoginError('No authentication data available');
      return { success: false, needsOnboarding: false };
    }

    try {
      const result = await this.updateAccountAge(tokenData.accessToken, age);

      if (!result.success) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update age in store (auto-persisted to localStorage by $effect)
      userStore.age = age;

      // Track age update
      trackEvent(AnalyticsEventAction.CLICKED, {
        [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
        [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_AGE_UPDATED,
        [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.AUTH_PAGE,
        [ANALYTICS_EVENT_KEYS.label]: 'age_updated',
      });

      // Store tokens for later use after onboarding
      this.storeTokens(
        tokenData.accessToken,
        tokenData.refreshToken,
        tokenData.accessTokenExpiry,
        tokenData.refreshTokenExpiry
      );
      setAuthTokens(
        tokenData.accessToken,
        tokenData.refreshToken,
        tokenData.accessTokenExpiry,
        tokenData.refreshTokenExpiry
      );

      // Check if user already has a selfie (e.g. uploaded as guest before login).
      // If so, skip onboarding and complete login directly.
      try {
        const profileResult = await this.getUserProfile(tokenData.accessToken);
        if (profileResult.success && profileResult.data) {
          this.applyUserProfileData(profileResult.data);
          if (profileResult.data.imageUrl) {
            await this.completeLogin(
              {
                accessToken: tokenData.accessToken,
                refreshToken: tokenData.refreshToken,
                accessTokenExpiry: tokenData.accessTokenExpiry,
                refreshTokenExpiry: tokenData.refreshTokenExpiry,
              },
              { skipChatMigrate: false }
            );
            return { success: true, needsOnboarding: false };
          }
        }
      } catch (profileError) {
        console.error('Failed to fetch profile after age update:', profileError);
      }

      return { success: true, needsOnboarding: true };
    } catch (error) {
      console.error('Failed to update age:', error);
      setLoginError(error instanceof Error ? error.message : 'Failed to update profile');
      return { success: false, needsOnboarding: false };
    }
  }

  /**
   * Apply fetched user profile data to store and cache
   */
  private applyUserProfileData(responseData: UserProfileData) {
    const profileData = responseData;
    if (!profileData) return;

    // Store mutations auto-persist to localStorage via the $effect in user store
    if (profileData.profileId) {
      userStore.profileId = profileData.profileId;
    }
    if (profileData.imageUrl) {
      userStore.profileImage = profileData.imageUrl;
    }
    if (profileData.gender) {
      userStore.gender = profileData.gender.toLowerCase() as 'male' | 'female';
    }
    if (profileData.bodyType) {
      userStore.bodyType = profileData.bodyType;
    }
  }

  /**
   * Guest login with device ID
   * @param deviceId - Unique device identifier
   * @returns Guest auth response or null if failed
   */
  private async loginAsGuest(deviceId: string): Promise<{
    accessToken: string;
    userId: string;
    expiresIn: number;
    firestoreToken?: string;
  } | null> {
    try {
      const response = await fetch(`${API_ENDPOINTS.AI_INFLUENCER_BACKEND}/auth/token`, {
        method: 'POST',
        headers: {
          'X-Device-Identifier': deviceId,
        },
      });

      if (!response.ok) {
        console.error('[Auth] Guest login failed:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      return {
        accessToken: data.token || data.accessToken,
        userId: data.userId,
        expiresIn: data.expiresIn || 3600,
        firestoreToken: data.firestoreToken,
      };
    } catch (error) {
      console.error('[Auth] Guest login error:', error);
      return null;
    }
  }

  /**
   * Logout the user
   */
  logout() {
    // Track logout before clearing data
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.USER_INTERACTION,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.AUTH_LOGOUT,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.PROFILE_PAGE,
      [ANALYTICS_EVENT_KEYS.userId]: userStore.accountId || '',
      [ANALYTICS_EVENT_KEYS.label]: 'logout',
    });

    Sentry.setUser(null);
    Sentry.setTag('auth_type', null);

    // Clear stored tokens
    this.clearStoredTokens();
    this.clearStoredGuestToken();

    // Clear profile cookies
    this.clearProfileCookies();

    // Clear user store (everything except deviceId)
    // The $effect auto-removes the localStorage blob when all profile values are null
    clearAuth();

    // Clear try-on results (user-specific generated looks and chat VTON timers)
    resetAllTryOn();

    // Clear pending try-on state
    clearPendingTryOn();

    // Clear chat try-on queue
    clearChatTryOnQueue();

    // Reset login store
    closeLoginPopup();

    // Firebase signOut must complete before chat reset + guest login so that
    // signInWithCustomToken (called during the new guest chat init) doesn't race
    // against an active Firebase session from the logged-out user.
    import('$lib/firebase/auth')
      .then(({ signOut }) => signOut())
      .finally(() => {
        import('$lib/stores/chatStore.svelte').then(({ chatStore }) => {
          chatStore.fullReset();

          // Re-login as guest after chat is reset
          this.loginAsGuest(userStore.deviceId).then((guestResponse) => {
            if (guestResponse) {
              setGuestAuth(guestResponse.accessToken, guestResponse.expiresIn, guestResponse.userId);
              this.storeGuestToken(guestResponse);
            }
          });
        });
      });

    // Re-fetch server-loaded data without user context — fires immediately in
    // parallel since it only depends on cookies, not Firebase session state.
    import('$app/navigation').then(({ invalidateAll }) => invalidateAll());
  }

  /**
   * Refresh the current access token (guest or Google)
   * @returns Promise resolving to whether refresh was successful
   */
  async refreshToken(): Promise<boolean> {
    if (!this.isBrowser) return false;

    const authType = userStore.authType;

    if (authType === 'guest') {
      return await this.refreshGuestToken();
    } else if (authType === 'google') {
      return await this.refreshGoogleToken();
    }

    return false;
  }

  /**
   * Refresh guest token
   */
  private async refreshGuestToken(): Promise<boolean> {
    try {
      const currentToken = userStore.accessToken;
      if (!currentToken) return false;

      // Get influencer ID from localStorage (set by app when navigating to influencer)
      const influencerId = localStorage.getItem('influencer_id') || '';

      const response = await fetch(`${API_ENDPOINTS.AI_INFLUENCER_BACKEND}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'X-Device-Identifier': userStore.deviceId,
          'X-Influencer-Id': influencerId,
        },
      });

      if (!response.ok) {
        console.error('[Auth] Guest token refresh failed:', response.status);
        Sentry.captureMessage(`Guest token refresh failed: ${response.status}`, {
          level: 'error',
          tags: { operation: 'guest_token_refresh' },
        });

        // If refresh fails, try to get new guest token
        const newTokenResponse = await this.loginAsGuest(userStore.deviceId);
        if (newTokenResponse) {
          setGuestAuth(newTokenResponse.accessToken, newTokenResponse.expiresIn, newTokenResponse.userId);
          this.storeGuestToken(newTokenResponse);
          console.log('[Auth] Got new guest token after refresh failure');
          return true;
        }

        return false;
      }

      const data = await response.json();
      setGuestAuth(data.accessToken || data.token, data.expiresIn || 3600, data.userId);
      this.storeGuestToken({
        accessToken: data.accessToken || data.token,
        userId: data.userId,
        expiresIn: data.expiresIn || 3600,
        firestoreToken: data.firestoreToken,
      });

      console.log('[Auth] Guest token refreshed successfully');
      return true;
    } catch (error) {
      console.error('[Auth] Guest token refresh error:', error);
      Sentry.captureException(error, { tags: { operation: 'guest_token_refresh' } });
      return false;
    }
  }

  /**
   * Refresh Google token using refresh token
   * Calls Glance Account API to get new access and refresh tokens
   */
  private async refreshGoogleToken(): Promise<boolean> {
    try {
      const refreshToken = this.getStoredRefreshToken();
      if (!refreshToken) {
        console.warn('[Auth] No refresh token available for Google');
        return false;
      }

      const response = await fetch(
        `${API_ENDPOINTS.GLANCE_ACCOUNT}/api/v0/glance/auth/token/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: refreshToken,
            'X-Client-Id': AUTH_CLIENT_ID,
          },
        }
      );

      if (!response.ok) {
        console.error('[Auth] Google token refresh failed:', response.status);
        Sentry.captureMessage(`Google token refresh failed: ${response.status}`, {
          level: 'error',
          tags: { operation: 'google_token_refresh' },
        });
        // Clear invalid tokens on failure
        this.clearStoredTokens();
        return false;
      }

      const data = await response.json();

      // Store new tokens with expiry timestamps
      const accessTokenExpiry = data.accessTokenExpiry || Date.now() + ACCESS_TOKEN_EXPIRY_MS;
      const refreshTokenExpiry = data.refreshTokenExpiry || Date.now() + REFRESH_TOKEN_EXPIRY_MS;

      this.storeTokens(data.accessToken, data.refreshToken, accessTokenExpiry, refreshTokenExpiry);

      setAuthTokens(data.accessToken, data.refreshToken, accessTokenExpiry, refreshTokenExpiry);

      console.log('[Auth] Google token refreshed successfully');
      return true;
    } catch (error) {
      console.error('[Auth] Google token refresh error:', error);
      Sentry.captureException(error, { tags: { operation: 'google_token_refresh' } });
      // Clear invalid tokens on error
      this.clearStoredTokens();
      return false;
    }
  }

  /**
   * Map Glance API error status codes to user-facing error messages
   */
  private mapGlanceApiError(
    status: number,
    statusText: string,
    errorData: { error?: string }
  ): string {
    if (status === 400) {
      return 'Access token header cannot be blank';
    }
    if (status === 401) {
      return errorData.error === 'invalid_client'
        ? 'Client id cannot be null or empty'
        : 'Invalid/expired token';
    }
    return `HTTP ${status}: ${statusText}`;
  }

  /**
   * Sync profile cookies and re-fetch server data after profile changes (e.g., selfie update)
   */
  syncProfileAndRefetch() {
    // Clear try-on results — old looks were generated with the previous selfie
    resetAllTryOn();
    this.setProfileCookies(userStore.profileId || '', userStore.accountId || '');
    import('$app/navigation').then(({ invalidateAll }) => invalidateAll());
  }

  /**
   * Profile cookie helpers (for server-side access in load functions)
   */
  private setProfileCookies(profileId: string, accountId: string) {
    if (!this.isBrowser) return;

    const maxAge = 30 * 24 * 60 * 60; // 30 days
    const setOpts = `path=/;max-age=${maxAge};SameSite=Lax`;
    const clearOpts = 'path=/;max-age=0';

    document.cookie = profileId
      ? `ai_influencer_profile_id=${encodeURIComponent(profileId)};${setOpts}`
      : `ai_influencer_profile_id=;${clearOpts}`;
    document.cookie = accountId
      ? `ai_influencer_account_id=${encodeURIComponent(accountId)};${setOpts}`
      : `ai_influencer_account_id=;${clearOpts}`;
  }

  private clearProfileCookies() {
    if (!this.isBrowser) return;

    document.cookie = 'ai_influencer_profile_id=;path=/;max-age=0';
    document.cookie = 'ai_influencer_account_id=;path=/;max-age=0';
  }

  /**
   * Token storage helpers
   */
  private storeTokens(
    accessToken: string,
    refreshToken: string,
    accessTokenExpiry?: number,
    refreshTokenExpiry?: number
  ) {
    if (!this.isBrowser) return;

    localStorage.setItem('ai_influencer_access_token', accessToken);
    localStorage.setItem('ai_influencer_refresh_token', refreshToken);
    if (accessTokenExpiry) {
      localStorage.setItem('ai_influencer_access_token_expiry', accessTokenExpiry.toString());
    }
    if (refreshTokenExpiry) {
      localStorage.setItem('ai_influencer_refresh_token_expiry', refreshTokenExpiry.toString());
    }
  }

  private getStoredAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('ai_influencer_access_token');
  }

  private getStoredRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('ai_influencer_refresh_token');
  }

  private getStoredAccessTokenExpiry(): number | undefined {
    if (!this.isBrowser) return undefined;
    const expiry = localStorage.getItem('ai_influencer_access_token_expiry');
    return expiry ? parseInt(expiry, 10) : undefined;
  }

  private getStoredRefreshTokenExpiry(): number | undefined {
    if (!this.isBrowser) return undefined;
    const expiry = localStorage.getItem('ai_influencer_refresh_token_expiry');
    return expiry ? parseInt(expiry, 10) : undefined;
  }

  private clearStoredTokens() {
    if (!this.isBrowser) return;
    localStorage.removeItem('ai_influencer_access_token');
    localStorage.removeItem('ai_influencer_refresh_token');
    localStorage.removeItem('ai_influencer_access_token_expiry');
    localStorage.removeItem('ai_influencer_refresh_token_expiry');
  }

  private storeGuestToken(guestData: {
    accessToken: string;
    userId: string;
    expiresIn: number;
    firestoreToken?: string;
  }) {
    if (!this.isBrowser) return;
    const expiresAt = Date.now() + guestData.expiresIn * 1000;
    const tokenData = {
      accessToken: guestData.accessToken,
      userId: guestData.userId,
      expiresAt,
      firestoreToken: guestData.firestoreToken,
    };
    localStorage.setItem('ai_influencer_guest_token', JSON.stringify(tokenData));
  }

  private getStoredGuestToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem('ai_influencer_guest_token');
  }

  private parseStoredGuestToken(stored: string): {
    accessToken: string;
    expiresIn: number;
    userId?: string;
  } | null {
    try {
      const data = JSON.parse(stored);
      // Check if token is expired
      // console.log('[Auth] Checking stored guest token expiry:', data.expiresAt, Date.now());
      if (data.expiresAt && Date.now() >= data.expiresAt) {
        console.log('[Auth] Stored guest token expired');
        this.clearStoredGuestToken();
        return null;
      }
      const expiresIn = data.expiresAt ? Math.floor((data.expiresAt - Date.now()) / 1000) : 3600;
      return {
        accessToken: data.accessToken,
        expiresIn,
        userId: data.userId, // Include userId from stored token
      };
    } catch {
      return null;
    }
  }

  private clearStoredGuestToken() {
    if (!this.isBrowser) return;
    localStorage.removeItem('ai_influencer_guest_token');
  }

  /**
   * Get account info (age, account ID) from Glance Account API
   *
   * @param accessToken - The user's access token
   * @returns Promise resolving to ServiceResult with account data
   */
  async getAccountInfo(
    accessToken: string
  ): Promise<ServiceResult<AuthResponse['user'] & { age: number }>> {
    try {
      const headers = {
        Authorization: accessToken,
        'X-Client-Id': AUTH_CLIENT_ID,
      };

      // Using the same endpoint as glance-ai-embed
      const response = await fetch(`${API_ENDPOINTS.GLANCE_ACCOUNT}/api/v0/user`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: this.mapGlanceApiError(response.status, response.statusText, errorData),
        };
      }

      const profileData = await response.json();

      return {
        data: profileData,
        success: true,
      };
    } catch (error) {
      console.error('Get profile operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during get profile',
      };
    }
  }

  /**
   * Fetch user profile (selfie, gender, body type) from the profile API
   * Called after age check/update to get onboarding data
   *
   * @param accessToken - The user's access token
   * @returns Promise resolving to ServiceResult with user profile data
   */
  async getUserProfile(accessToken: string): Promise<ServiceResult<UserProfileData>> {
    try {
      const response = await fetch(`${API_ENDPOINTS.AI_INFLUENCER_BACKEND}/customer/profile`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
          'x-influencer-id': browser ? localStorage.getItem('influencer_id') || '' : '',
          'X-Device-Identifier': userStore.deviceId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const profileData = await response.json();
      return {
        data: profileData,
        success: true,
      };
    } catch (error) {
      console.error('User profile fetch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching user profile',
      };
    }
  }

  /**
   * Update user age on Glance Account API
   *
   * @param accessToken - The user's access token
   * @param age - The user's age to update
   * @returns Promise resolving to ServiceResult indicating success/failure
   */
  async updateAccountAge(accessToken: string, age: number): Promise<ServiceResult<void>> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: accessToken,
        'X-Client-Id': AUTH_CLIENT_ID,
      };

      const requestBody = { age };

      // Using the same endpoint as glance-ai-embed
      const response = await fetch(`${API_ENDPOINTS.GLANCE_ACCOUNT}/api/v0/user`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = this.mapGlanceApiError(
          response.status,
          response.statusText,
          errorData
        );
        return {
          success: false,
          error: errorMessage,
          message: errorMessage,
        };
      }

      // 204 No Content indicates successful update
      return {
        success: true,
      };
    } catch (error) {
      console.error('Update profile operation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during update profile',
        message: error instanceof Error ? error.message : 'Unknown error during update profile',
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
