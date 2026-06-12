/**
 * Login store for managing login popup and authentication flow
 */

import { consumePendingLoginAction } from '$lib/services/loginIntent';

interface LoginTokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

interface LoginStore {
  // Popup visibility
  isPopupVisible: boolean;
  isAgeConsentPopupVisible: boolean;

  // Login state
  loginInProgress: boolean;
  loginTokenData: LoginTokenData | null;

  // Whether the popup should show a "skip login" option (try-on / chat context)
  allowSkip: boolean;

  // Error handling
  error: string | null;
}

// Create the reactive store
export const loginStore = $state<LoginStore>({
  isPopupVisible: false,
  isAgeConsentPopupVisible: false,
  loginInProgress: false,
  loginTokenData: null,
  allowSkip: false,
  error: null,
});

// Helper functions for managing popup state
export function showLoginPopup(options?: { allowSkip?: boolean }) {
  loginStore.isPopupVisible = true;
  loginStore.isAgeConsentPopupVisible = false;
  loginStore.allowSkip = options?.allowSkip ?? false;
  loginStore.error = null;
}

export function closeLoginPopup() {
  loginStore.isPopupVisible = false;
  loginStore.isAgeConsentPopupVisible = false;
  loginStore.loginInProgress = false;
  loginStore.loginTokenData = null;
  loginStore.allowSkip = false;
  loginStore.error = null;

  consumePendingLoginAction();
}

export function showAgeConsentPopup() {
  loginStore.isAgeConsentPopupVisible = true;
}

export function hideAgeConsentPopup() {
  loginStore.isAgeConsentPopupVisible = false;
}

export function setLoginInProgress(inProgress: boolean) {
  loginStore.loginInProgress = inProgress;
}

export function setLoginTokenData(data: LoginTokenData | null) {
  loginStore.loginTokenData = data;
}

export function setLoginError(error: string | null) {
  loginStore.error = error;
}
