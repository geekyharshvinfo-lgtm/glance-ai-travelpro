/**
 * Onboarding store for managing the user onboarding flow
 */

interface OnboardingStore {
  // Flow state
  isActive: boolean;
  currentStep: 'selfie' | 'camera' | 'details' | 'bodyType' | 'submitting' | 'complete';
  isFromLogin: boolean; // Track if onboarding was triggered from login

  // Selected values
  selectedGender: 'male' | 'female' | null;
  selectedBodyType: string | null;
  selectedFile: Blob | null;
  selfiePreviewUrl: string | null;

  // UI state
  error: string | null;
  isSubmitting: boolean;
}

// Create the reactive store
export const onboardingStore = $state<OnboardingStore>({
  isActive: false,
  currentStep: 'selfie',
  isFromLogin: false,
  selectedGender: null,
  selectedBodyType: null,
  selectedFile: null,
  selfiePreviewUrl: null,
  error: null,
  isSubmitting: false,
});

// Helper functions
export function startOnboarding(fromLogin = false) {
  // Reset all state before starting
  resetOnboarding();
  // Then set active and fromLogin flag
  onboardingStore.isActive = true;
  onboardingStore.isFromLogin = fromLogin;
}

export function closeOnboarding() {
  onboardingStore.isActive = false;
  resetOnboarding();
}

export function resetOnboarding() {
  onboardingStore.currentStep = 'selfie';
  onboardingStore.isFromLogin = false;
  onboardingStore.selectedGender = null;
  onboardingStore.selectedBodyType = null;
  onboardingStore.selectedFile = null;
  onboardingStore.selfiePreviewUrl = null;
  onboardingStore.error = null;
  onboardingStore.isSubmitting = false;
}

export function setOnboardingStep(step: OnboardingStore['currentStep']) {
  onboardingStore.currentStep = step;
  onboardingStore.error = null;
}

export function setOnboardingError(error: string | null) {
  onboardingStore.error = error;
}

export function setSelectedGender(gender: 'male' | 'female') {
  onboardingStore.selectedGender = gender;
}

export function setSelectedBodyType(bodyType: string) {
  onboardingStore.selectedBodyType = bodyType;
}

export function setSelfie(file: Blob, previewUrl: string) {
  onboardingStore.selectedFile = file;
  onboardingStore.selfiePreviewUrl = previewUrl;
}

export function clearSelfie() {
  onboardingStore.selectedFile = null;
  if (onboardingStore.selfiePreviewUrl) {
    URL.revokeObjectURL(onboardingStore.selfiePreviewUrl);
    onboardingStore.selfiePreviewUrl = null;
  }
  // Also clear temporary storage
  localStorage.removeItem('ai_influencer_temp_selfie');
}
