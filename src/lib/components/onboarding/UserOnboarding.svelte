<script lang="ts">
  import {
    onboardingStore,
    closeOnboarding,
    setOnboardingStep,
    setSelectedGender,
    setSelectedBodyType,
    setSelfie,
    clearSelfie,
    setOnboardingError,
  } from '$lib/stores/onboarding.svelte';
  // submitOnboarding and uploadSelfie require Spring Boot / Bifrost — bypassed locally
  import { userStore } from '$lib/stores/user.svelte';
  import { authService } from '$lib/services/auth';
  import { BODY_TYPES_CONFIG } from '$lib/constants/bodyTypes';
  import { onMount } from 'svelte';
  import Camera from './Camera.svelte';
  import {
    BackButton,
    GlanceAILogo,
    CameraGradientIcon,
    AlertCircleIcon,
    MaleGenderIcon,
    FemaleGenderIcon,
  } from '../icons';
  import { chatStore } from '$lib/stores/chatStore.svelte';

  let fileInput = $state<HTMLInputElement | null>(null);
  let carouselRef = $state<HTMLElement | null>(null);
  let scrollTimeout: ReturnType<typeof setTimeout>;

  // State
  let showBodyTypeSelection = $state(false);

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setOnboardingError('Please select an image file');
        // Reset input so user can try selecting again
        input.value = '';
        return;
      }

      // Read bytes immediately while Instagram WebView still holds the URI permission.
      // Storing a File keeps a live reference to the content URI which Instagram can
      // revoke on any activity transition, causing ERR_UPLOAD_FILE_CHANGED at upload time.
      // A Blob backed by ArrayBuffer is fully in-memory and immune to URI revocation.
      const arrayBuffer = await file.arrayBuffer();
      const detachedBlob = new Blob([arrayBuffer], { type: file.type });

      input.value = '';

      const previewUrl = URL.createObjectURL(detachedBlob);
      setSelfie(detachedBlob, previewUrl);
      localStorage.setItem('ai_influencer_temp_selfie', previewUrl);
    }
  }

  function triggerFileInput() {
    fileInput?.click();
  }

  function triggerCamera() {
    setOnboardingStep('camera');
  }

  async function goBack() {
    if (showBodyTypeSelection) {
      showBodyTypeSelection = false;
    } else if (onboardingStore.currentStep === 'selfie' && onboardingStore.selectedFile) {
      clearSelfie();
    } else {
      const wasFromLogin = onboardingStore.isFromLogin;
      closeOnboarding();

      if (wasFromLogin && userStore.accessToken) {
        try {
          await authService.completeLogin(
            {
              accessToken: userStore.accessToken,
              refreshToken: userStore.refreshToken!,
              accessTokenExpiry: Date.now() + 3600000,
              refreshTokenExpiry: Date.now() + 2592000000,
            },
            { skipChatMigrate: true }
          );
        } catch {
          // Fallback navigation handled by +page.svelte effect
        }
      }
    }
  }

  function handleContinue() {
    const { selectedGender } = onboardingStore;

    if (!selectedGender) {
      setOnboardingError('Please select your gender');
      return;
    }

    // Gender check using influencer_gender from localStorage
    // let influencerGender = null;
    // if (browser) {
    //   influencerGender = localStorage.getItem('influencer_gender');
    // }
    // if (influencerGender && selectedGender !== influencerGender) {
    //   setOnboardingError(`Only '${influencerGender}' users can onboard for this influencer.`);
    //   return;
    // }

    showBodyTypeSelection = true;
  }

  function handleScrollEnd() {
    if (!carouselRef) return;

    // Calculate which image is currently visible
    const scrollLeft = carouselRef.scrollLeft;
    const containerWidth = carouselRef.clientWidth;
    const currentIndex = Math.round(scrollLeft / containerWidth);

    // Set the selected body type based on the visible image
    const bodyTypes = onboardingStore.selectedGender
      ? BODY_TYPES_CONFIG[onboardingStore.selectedGender]
      : [];
    if (bodyTypes[currentIndex]) {
      setSelectedBodyType(bodyTypes[currentIndex].displayName);
    }
  }

  function handleCarouselScroll() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScrollEnd, 150);
  }

  async function handleGenerateLooks() {
    const { selectedGender, selectedBodyType, selectedFile, selfiePreviewUrl } = onboardingStore;

    if (!selectedGender || !selectedBodyType || !selectedFile) {
      setOnboardingError('Please complete all steps');
      return;
    }

    onboardingStore.isSubmitting = true;
    setOnboardingError(null);

    try {
      // Convert selfie to a data URL so it survives page refresh (blob URLs die)
      const selfieDataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Set user profile directly in store (bypasses Spring Boot / Bifrost)
      userStore.gender = selectedGender;
      userStore.profileImage = selfieDataUrl;

      // Persist so it survives page refresh
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ai_influencer_local_selfie', selfieDataUrl);
      }

      setOnboardingStep('complete');
      setTimeout(() => {
        closeOnboarding();
      }, 100);
    } catch (error) {
      console.error('Onboarding error:', error);
      setOnboardingError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      onboardingStore.isSubmitting = false;
    }
  }

  // Clean up preview URL on unmount
  onMount(() => {
    return () => {
      if (onboardingStore.selfiePreviewUrl) {
        URL.revokeObjectURL(onboardingStore.selfiePreviewUrl);
      }
    };
  });

  // Reset local state when onboarding becomes active
  $effect(() => {
    if (onboardingStore.isActive && onboardingStore.currentStep === 'selfie') {
      showBodyTypeSelection = false;
    }
  });

  const bodyTypes = $derived(
    onboardingStore.selectedGender ? BODY_TYPES_CONFIG[onboardingStore.selectedGender] : []
  );
</script>

{#if onboardingStore.isActive}
  <div class="onboarding-overlay">
    {#if onboardingStore.currentStep === 'camera'}
      <!-- Camera Screen -->
      <Camera />
    {:else if showBodyTypeSelection}
      <!-- Body Type Selection Screen -->
      <div class="body-type-selection">
        <header class="header">
          <button class="back-btn" onclick={goBack} disabled={onboardingStore.isSubmitting}>
            <BackButton />
          </button>
          <div class="header-title">
            <GlanceAILogo />
          </div>
        </header>

        <div class="body-type-carousel">
          <div class="carousel" bind:this={carouselRef} onscroll={handleCarouselScroll}>
            {#each bodyTypes as bodyType (bodyType.id)}
              <div class="carousel-item">
                <img
                  src={bodyType.iconUrl}
                  alt="{bodyType.displayName} body type"
                  class="carousel-image"
                  crossorigin="anonymous"
                />
              </div>
            {/each}
          </div>
        </div>

        <div class="body-type-footer">
          <p class="footer-text">SELECT YOUR CLOSEST BODY TYPE</p>

          <div class="body-type-thumbnails">
            {#each bodyTypes as bodyType, index (bodyType.id)}
              <button
                class="thumbnail-btn{onboardingStore.selectedBodyType === bodyType.displayName
                  ? ' selected'
                  : ''}"
                onclick={() => {
                  setSelectedBodyType(bodyType.displayName);
                  if (carouselRef) {
                    const scrollLeft = index * carouselRef.clientWidth;
                    carouselRef.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                  }
                }}
              >
                <div class="thumbnail-circle">
                  {#if onboardingStore.selectedBodyType === bodyType.displayName}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="tick-icon">
                      <path
                        d="M5 13L9 17L19 7"
                        stroke="white"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  {:else}
                    <img
                      src={bodyType.thumbnailUrl}
                      alt="{bodyType.displayName} thumbnail"
                      class="thumbnail-img"
                      crossorigin="anonymous"
                    />
                  {/if}
                </div>
              </button>
            {/each}
          </div>

          <button
            class="generate-looks-btn"
            onclick={handleGenerateLooks}
            disabled={onboardingStore.isSubmitting || !onboardingStore.selectedBodyType}
          >
            {#if onboardingStore.isSubmitting}
              <div class="button-spinner"></div>
            {/if}
            GENERATE LOOKS
          </button>
        </div>
      </div>
    {:else if onboardingStore.currentStep === 'selfie'}
      <!-- Selfie Selection Screen -->
      <div class="onboarding-container">
        <header class="header">
          <button class="back-btn" onclick={goBack} disabled={onboardingStore.isSubmitting}>
            <BackButton />
          </button>
          <div class="header-title">
            <GlanceAILogo />
          </div>
          <div class="header-spacer"></div>
        </header>

        <div class="content">
          <input
            bind:this={fileInput}
            type="file"
            accept="image/*"
            onchange={handleFileSelect}
            style="display: none"
          />

          {#if onboardingStore.selfiePreviewUrl}
            <!-- Review Selfie Screen -->
            <h2 class="review-title">Review Your Photo</h2>
            <!-- <p class="review-subtitle">Ensure good lighting and a clear view of your face</p> -->

            <div class="selfie-preview-container">
              <img
                src={onboardingStore.selfiePreviewUrl}
                alt="Selfie preview"
                class="selfie-preview"
              />
            </div>

            <div class="gender-section">
              <h3 class="gender-title">How do you want to style yourself as?</h3>
              <div class="gender-options">
                <button
                  class="gender-btn{onboardingStore.selectedGender === 'male' ? ' selected' : ''}"
                  onclick={() => setSelectedGender('male')}
                >
                  <MaleGenderIcon />
                  Male
                </button>
                <button
                  class="gender-btn{onboardingStore.selectedGender === 'female' ? ' selected' : ''}"
                  onclick={() => setSelectedGender('female')}
                >
                  <FemaleGenderIcon />
                  Female
                </button>
              </div>
              <div class="gender-note">
                <AlertCircleIcon
                  width={16}
                  height={16}
                  stroke="white"
                  strokeOpacity={0.6}
                  strokeWidth={0.8}
                />
                <span>More diverse identities are coming soon</span>
              </div>
            </div>

            <button
              class="continue-btn"
              onclick={handleContinue}
              disabled={!onboardingStore.selectedGender}
            >
              CONTINUE
            </button>
          {:else}
            <!-- Take Selfie Screen -->
            <h1 class="title">To get started</h1>
            <p class="subtitle">Add your photo</p>

            <div class="camera-placeholder-container">
              <div class="camera-placeholder">
                <div class="camera-icon">
                  <CameraGradientIcon width={80} height={80} />
                </div>
              </div>
            </div>

            <p class="instructions">
              Make sure you are facing the camera<br />
              with good lighting
            </p>

            <button class="take-selfie-btn" onclick={triggerCamera}> TAKE A PHOTO </button>
            <span class="or-text">OR</span>
            <button class="upload-photo-btn" onclick={triggerFileInput}> UPLOAD PHOTO </button>
          {/if}
        </div>
      </div>
    {:else if onboardingStore.currentStep === 'complete'}
      <!-- Success Screen -->
      <div class="onboarding-container">
        <div class="success-content">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="#4CAF50" stroke-width="4" />
            <path d="M20 32L28 40L44 24" stroke="#4CAF50" stroke-width="4" stroke-linecap="round" />
          </svg>
          <h3>Success!</h3>
          <p>Your AI look is being generated</p>
        </div>
      </div>
    {/if}

    {#if onboardingStore.error}
      <p class="error-message">{onboardingStore.error}</p>
    {/if}
  </div>
{/if}

<style>
  .onboarding-overlay {
    position: fixed;
    inset: 0;
    background: #111;
    z-index: 2000;
    display: flex;
    flex-direction: column;
  }

  /* Common header styles */
  .header {
    display: flex;
    align-items: center;
    padding: 1rem;
    position: relative;
  }

  .back-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #333;
    transition: opacity 0.2s;
  }

  .back-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .header-title {
    flex: 1;
    text-align: center;
  }

  .header-spacer {
    width: 40px;
  }

  /* Container styles */
  .onboarding-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1.5rem 2rem;
    overflow-y: auto;
  }

  /* Selfie screen styles */
  .title {
    font-size: 22px;
    font-weight: 700;
    margin: 20px 0 8px 0;
    color: #fff;
    text-align: center;
    line-height: 28px;
  }

  .subtitle {
    font-size: 14px;
    margin: 0 0 40px 0;
    text-align: center;
    color: #fff;
    font-weight: 400;
    line-height: 140%;
    letter-spacing: -0.28px;
    opacity: 0.6;
  }

  /* Review screen styles */
  .review-title {
    margin: 1rem 0 0.5rem;
    color: #fff;
    text-align: center;
    font-size: 22.889px;
    font-style: normal;
    font-weight: 600;
    line-height: 27.467px;
  }

  .camera-placeholder-container {
    padding: 30px;
    margin-bottom: 20px;
  }

  .camera-placeholder {
    width: 160px;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 1000px;
    border: 2px solid #fff;
  }

  .camera-icon {
    opacity: 0.7;
  }

  .selfie-preview-container {
    width: 280px;
    height: 320px;
    position: relative;
    margin: 1rem 0;
    border-radius: 12px;
    overflow: hidden;
  }

  .selfie-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .instructions {
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 40px;
    text-align: center;
    color: #fff;
    font-weight: 400;
    line-height: 140%;
    letter-spacing: -0.26px;
    opacity: 0.6;
  }

  /* Gender selection */
  .gender-section {
    width: 80%;
    max-width: 400px;
    margin: 2rem 0;
  }

  .gender-title {
    font-weight: 600;
    margin: 0 0 1rem;
    text-align: center;
    color: #fff;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }

  .gender-options {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .gender-btn {
    flex: 1;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    color: #fff;
    text-align: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 14px; /* 100% */
    padding: 10.021px 25px 9.979px 25px;
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    text-transform: uppercase;
  }

  .gender-btn.selected {
    border: 1px solid #fff;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.06) 0%,
      rgba(153, 153, 153, 0.06) 100%
    );
  }

  .gender-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    font-size: 11px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
  }

  .take-selfie-btn,
  .upload-photo-btn,
  .continue-btn {
    width: 100%;
    max-width: 300px;
    padding: 19.5px 30px;
    font-size: 13px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    text-transform: uppercase;
  }

  .take-selfie-btn,
  .continue-btn {
    color: #111;
    border: 1px solid var(--Linear-Border, rgba(255, 255, 255, 0.22));
    opacity: 0.9;
    background: #fff;
    backdrop-filter: blur(5px);
  }

  .upload-photo-btn {
    border: 1px solid var(--Linear-Border, rgba(255, 255, 255, 0.22));
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    line-height: 140%;
    opacity: 0.9;
  }

  .or-text {
    margin: 16px 0;
    color: #fff;
    text-align: center;
    font-size: 13px;
    font-style: normal;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: -0.26px;
    opacity: 0.4;
  }

  .continue-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* Body type selection screen */
  .body-type-selection {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .body-type-carousel {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .carousel {
    width: 100%;
    height: 100%;
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .carousel::-webkit-scrollbar {
    display: none;
  }

  .carousel-item {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    scroll-snap-align: start;
    scroll-snap-stop: always;
  }

  .carousel-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .body-type-footer {
    background: #111;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .footer-text {
    font-weight: 700;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
    text-transform: uppercase;
    color: #fff;
    line-height: 32.044px;
    letter-spacing: 0.7px;
  }

  .body-type-thumbnails {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .thumbnail-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 2px solid transparent;
    background: transparent;
    padding: 0;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.2s;
    position: relative;
  }

  .thumbnail-btn.selected {
    border-color: #000;
    transform: scale(1.1);
  }

  .thumbnail-circle {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 50%;
  }

  .thumbnail-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .tick-icon {
    width: 24px;
    height: 24px;
  }

  .generate-looks-btn {
    width: 227px;
    height: 48px;
    background: #fff;
    color: #111;
    border: none;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .generate-looks-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .button-spinner {
    width: 14px;
    height: 14px;
    border: 1.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: black;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Success screen */
  .success-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .success-content h3 {
    font-size: 1.5rem;
    margin: 0;
  }

  .success-content p {
    color: #666;
    margin: 0;
  }

  .error-message {
    color: #d32f2f;
    font-size: 0.875rem;
    text-align: center;
    margin: 1rem;
  }
</style>
