<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { GlanceAILogo, CameraGradientIcon } from '$lib/components/icons';
  import Camera from '$lib/components/onboarding/Camera.svelte';
  import { onboardingStore, setOnboardingStep, setSelfie, clearSelfie } from '$lib/stores/onboarding.svelte';

  let mode = $state<'intro' | 'camera' | 'preview'>('intro');
  let fileInput = $state<HTMLInputElement | null>(null);
  let selfiePreviewUrl = $state<string | null>(null);
  let selfieDataUrl = $state<string | null>(null);
  let isLoading = $state(false);

  function clearStoreCache() {
    const keysToRemove = Object.keys(sessionStorage).filter(k => k.startsWith('tp_img_') || k === 'tp_catalogue');
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
    sessionStorage.removeItem('travelpro_selfie');
  }

  function triggerCamera() {
    clearStoreCache();
    mode = 'camera';
    setOnboardingStep('camera');
  }

  function triggerFileInput() {
    clearStoreCache();
    fileInput?.click();
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    const previewUrl = URL.createObjectURL(blob);

    setSelfie(blob, previewUrl);
    selfiePreviewUrl = previewUrl;

    // Also convert to dataURL for persistence
    const reader = new FileReader();
    reader.onload = () => {
      selfieDataUrl = reader.result as string;
    };
    reader.readAsDataURL(blob);

    mode = 'preview';
    input.value = '';
  }

  // When camera completes (Camera component sets selfiePreviewUrl in onboardingStore)
  $effect(() => {
    if (onboardingStore.selfiePreviewUrl && mode === 'camera') {
      selfiePreviewUrl = onboardingStore.selfiePreviewUrl;
      // Convert blob to dataURL, then switch to preview
      if (onboardingStore.selectedFile) {
        const reader = new FileReader();
        reader.onload = () => {
          selfieDataUrl = reader.result as string;
          mode = 'preview';
        };
        reader.readAsDataURL(onboardingStore.selectedFile);
      } else {
        mode = 'preview';
      }
    }
  });

  function retake() {
    selfiePreviewUrl = null;
    selfieDataUrl = null;
    clearSelfie();
    mode = 'intro';
  }

  // Set to false to revert to localStorage (shared across all tabs on same device)
  const USE_SESSION_STORAGE = true;
  const selfieStorage = USE_SESSION_STORAGE ? sessionStorage : localStorage;

  // Show "View your store" if a generated feed exists in this tab's cache
  const hasCachedStore = $derived(
    browser &&
    sessionStorage.getItem('travelpro_selfie') !== null &&
    Object.keys(sessionStorage).some(k => k.startsWith('tp_img_'))
  );

  async function buildStore() {
    if (!selfieDataUrl) return;
    isLoading = true;
    selfieStorage.setItem('travelpro_selfie', selfieDataUrl);
    goto('/travelpro');
  }
</script>

<div class="page">
  {#if mode === 'camera'}
    <!-- Reuse existing Camera component — onClose returns to intro -->
    <Camera onClose={retake} />
  {:else if mode === 'preview'}
    <div class="onboarding-container">
      <header class="header">
        <button class="back-btn" onclick={retake}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="header-title"><GlanceAILogo /></div>
        <div style="width:40px"></div>
      </header>

      <div class="content">
        <h2 class="review-title">Looking Good!</h2>

        <div class="selfie-preview-container">
          <img src={selfiePreviewUrl} alt="Your selfie" class="selfie-preview" />
        </div>

        <p class="instructions">
          We'll show you every TravelPro bag<br />in real travel settings — just for you.
        </p>

        <button class="take-selfie-btn" onclick={buildStore} disabled={isLoading}>
          {#if isLoading}
            <div class="button-spinner"></div>
          {/if}
          BUILD MY STORE
        </button>
        <span class="or-text">OR</span>
        <button class="upload-photo-btn" onclick={retake}>RETAKE PHOTO</button>
      </div>
    </div>
  {:else}
    <!-- Intro / selfie capture screen -->
    <div class="onboarding-container">
      <header class="header">
        <div style="width:40px"></div>
        <div class="header-title"><GlanceAILogo /></div>
        <div style="width:40px"></div>
      </header>

      <div class="content">
        <input
          bind:this={fileInput}
          type="file"
          accept="image/*"
          onchange={handleFileSelect}
          style="display:none"
        />

        <h1 class="title">Welcome to<br />TravelPro</h1>
        <p class="subtitle">Add your photo to see every bag in real travel settings — curated just for you.</p>

        <div class="camera-placeholder-container">
          <div class="camera-placeholder">
            <div class="camera-icon">
              <CameraGradientIcon width={80} height={80} />
            </div>
          </div>
        </div>

        <p class="instructions">
          Make sure you are facing the camera<br />with good lighting
        </p>

        <button class="take-selfie-btn" onclick={triggerCamera}>TAKE A PHOTO</button>
        <span class="or-text">OR</span>
        <button class="upload-photo-btn" onclick={triggerFileInput}>UPLOAD PHOTO</button>

        {#if hasCachedStore}
          <button class="view-store-btn" onclick={() => goto('/travelpro')}>
            VIEW YOUR STORE →
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    min-height: 100dvh;
    background: #111;
  }

  .onboarding-container {
    width: 100%;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }

  .header {
    display: flex;
    align-items: center;
    padding: 1rem;
  }

  .back-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    cursor: pointer;
  }

  .header-title {
    flex: 1;
    text-align: center;
  }

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1.5rem 2rem;
  }

  .title {
    font-size: 22px;
    font-weight: 700;
    margin: 20px 0 8px;
    color: #fff;
    text-align: center;
    line-height: 28px;
  }

  .subtitle {
    font-size: 14px;
    margin: 0 0 32px;
    text-align: center;
    color: rgba(255,255,255,0.6);
    font-weight: 400;
    line-height: 140%;
    letter-spacing: -0.28px;
    max-width: 280px;
  }

  .review-title {
    margin: 1rem 0 0.5rem;
    color: #fff;
    text-align: center;
    font-size: 22px;
    font-weight: 600;
    line-height: 27px;
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

  .camera-icon { opacity: 0.7; }

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
    margin-bottom: 40px;
    text-align: center;
    color: rgba(255,255,255,0.6);
    font-weight: 400;
    line-height: 140%;
    letter-spacing: -0.26px;
  }

  .take-selfie-btn,
  .upload-photo-btn {
    width: 100%;
    max-width: 300px;
    padding: 19.5px 30px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .take-selfie-btn {
    color: #111;
    border: 1px solid rgba(255,255,255,0.22);
    background: #fff;
    backdrop-filter: blur(5px);
  }

  .take-selfie-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .upload-photo-btn {
    border: 1px solid rgba(255,255,255,0.22);
    background: rgba(255,255,255,0.12);
    color: #fff;
    opacity: 0.9;
  }

  .or-text {
    margin: 16px 0;
    color: rgba(255,255,255,0.4);
    text-align: center;
    font-size: 13px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: -0.26px;
  }

  .button-spinner {
    width: 14px;
    height: 14px;
    border: 1.5px solid rgba(0,0,0,0.2);
    border-radius: 50%;
    border-top-color: #111;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .view-store-btn {
    margin-top: 1.25rem;
    width: 100%;
    padding: 0.875rem 1.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    cursor: pointer;
    border: 1px solid rgba(118, 90, 234, 0.6);
    background: rgba(118, 90, 234, 0.15);
    color: rgba(255, 255, 255, 0.85);
  }
</style>
