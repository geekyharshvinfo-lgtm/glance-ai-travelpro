<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { setSelfie, setOnboardingError, setOnboardingStep } from '$lib/stores/onboarding.svelte';
  import { reverseSearchStore } from '$lib/stores/reverseSearch.svelte';
  import { getImageUploadUrl, uploadImage, getSignedUrl } from '$lib/api/upload';

  interface CameraProps {
    isReverseSearch?: boolean;
    onClose?: () => void;
  }

  let { isReverseSearch = false, onClose }: CameraProps = $props();

  let videoElement: HTMLVideoElement | null = $state(null);
  let canvasElement: HTMLCanvasElement | null = $state(null);
  let fileInput: HTMLInputElement | null = $state(null);
  let stream: MediaStream | null = null;
  let cameraActive = $state(false);
  let capturedImage: string | null = $state(null);
  let capturedBlob: Blob | null = $state(null);
  let isProcessing = $state(false);
  let isUploading = $state(false);
  let isFrontCamera = $state(true);

  // Start camera stream
  async function startCamera() {
    try {
      // Request camera with HD resolution if available
      // console.log('Requesting camera with HD resolution, front camera:', isFrontCamera);
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: isFrontCamera ? 'user' : 'environment',
        },
        audio: false,
      });

      if (videoElement) {
        videoElement.srcObject = stream;
        cameraActive = true;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (!isReverseSearch) {
        setOnboardingError('Unable to access camera. Please check permissions.');
      }
    }
  }

  // Toggle camera (front/back)
  async function toggleCamera() {
    stopCamera();
    isFrontCamera = !isFrontCamera;
    await startCamera();
  }

  // Stop camera stream
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      cameraActive = false;
    }
  }

  // Handle gallery button click
  function handleGalleryClick() {
    fileInput?.click();
  }

  // Handle file selection from gallery
  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    if (!file.type.startsWith('image/')) return;

    // Stop camera if running
    stopCamera();

    try {
      isProcessing = true;
      // Create a blob from the file
      capturedBlob = file;
      capturedImage = URL.createObjectURL(file);
    } catch (error) {
      console.error('Error processing image file:', error);
    } finally {
      isProcessing = false;
      // Reset input
      target.value = '';
    }
  }

  // Capture photo from video stream
  function capturePhoto() {
    if (!videoElement || !canvasElement) return;

    isProcessing = true;

    // Get the actual dimensions of the video element as displayed on screen
    const videoRect = videoElement.getBoundingClientRect();
    const displayWidth = videoRect.width;
    const displayHeight = videoRect.height;

    // Get the intrinsic video dimensions
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;

    // Set canvas to match the displayed dimensions exactly
    canvasElement.width = displayWidth;
    canvasElement.height = displayHeight;

    // Calculate aspect ratios to determine how the video fits into the display area
    const videoRatio = videoWidth / videoHeight;
    const displayRatio = displayWidth / displayHeight;

    let sx, sy, sWidth, sHeight;

    if (videoRatio > displayRatio) {
      // Video is wider than display area - crop sides
      sHeight = videoHeight;
      sWidth = videoHeight * displayRatio;
      sx = (videoWidth - sWidth) / 2;
      sy = 0;
    } else {
      // Video is taller than display area - crop top/bottom
      sWidth = videoWidth;
      sHeight = videoWidth / displayRatio;
      sx = 0;
      sy = (videoHeight - sHeight) / 2;
    }

    // Draw video frame to canvas
    const context = canvasElement.getContext('2d');
    if (context) {
      context.save();
      context.clearRect(0, 0, canvasElement.width, canvasElement.height);

      if (isFrontCamera) {
        // Flip horizontally for un-mirroring (selfie mode correction)
        context.scale(-1, 1);
        context.drawImage(
          videoElement,
          sx,
          sy,
          sWidth,
          sHeight,
          -canvasElement.width,
          0,
          canvasElement.width,
          canvasElement.height
        );
      } else {
        context.drawImage(
          videoElement,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );
      }
      context.restore();

      // Convert to blob
      canvasElement.toBlob(
        (blob) => {
          if (blob) {
            capturedBlob = blob;
            capturedImage = URL.createObjectURL(blob);
            stopCamera(); // Stop camera after capture
          }
          isProcessing = false;
        },
        'image/jpeg',
        1
      );
    }
  }

  // Retake photo
  function retakePhoto() {
    if (capturedImage && capturedImage.startsWith('blob:')) {
      URL.revokeObjectURL(capturedImage);
    }
    capturedImage = null;
    capturedBlob = null;
    startCamera();
  }

  // Confirm and use captured photo
  async function confirmPhoto() {
    if (isUploading || !capturedBlob || !capturedImage) return;

    if (isReverseSearch) {
      // Reverse search flow - upload to GCS
      try {
        isUploading = true;

        // Get upload URL from the API
        const uploadUrlResponse = await getImageUploadUrl();
        if (!uploadUrlResponse) {
          throw new Error('Failed to get upload URL');
        }

        const gcsUrl = uploadUrlResponse.gcsUrl;

        // Store GCS URL in reverseSearchStore
        reverseSearchStore.gcsUrl = gcsUrl;

        // Upload the image blob
        const uploadSuccess = await uploadImage(uploadUrlResponse.uploadUrl, capturedBlob);
        if (!uploadSuccess) {
          throw new Error('Failed to upload image');
        }

        // Get signed URL for displaying the image
        try {
          reverseSearchStore.imageUrl = capturedImage;
          const signedUrlResponse = await getSignedUrl(gcsUrl);
          if (signedUrlResponse?.signedUrl) {
            // Set the signed URL for displaying the image
            reverseSearchStore.imageUrl = signedUrlResponse.signedUrl;
            // Revoke the temporary blob URL to avoid memory leaks
            if (capturedImage.startsWith('blob:')) {
              URL.revokeObjectURL(capturedImage);
            }
          }
        } catch (error) {
          console.error('Error getting signed URL:', error);
          // Keep using the blob URL if signed URL fails
        }

        // Stop camera and close
        stopCamera();
        if (onClose) {
          onClose();
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        if (!isReverseSearch) {
          setOnboardingError('Failed to upload image. Please try again.');
        }
      } finally {
        isUploading = false;
      }
    } else {
      // Onboarding flow - store locally
      const file = new File([capturedBlob], 'selfie.jpg', { type: 'image/jpeg' });

      // Store in onboarding store
      setSelfie(file, capturedImage);

      // Store the preview URL to be used later for profile image
      localStorage.setItem('ai_influencer_temp_selfie', capturedImage);

      // Navigate back to onboarding flow
      setOnboardingStep('selfie');
    }
  }

  // Go back
  function goBack() {
    stopCamera();
    if (capturedImage && capturedImage.startsWith('blob:')) {
      URL.revokeObjectURL(capturedImage);
    }

    if (isReverseSearch && onClose) {
      onClose();
    } else {
      setOnboardingStep('selfie');
    }
  }

  onMount(() => {
    startCamera();
  });

  onDestroy(() => {
    stopCamera();
    if (capturedImage && capturedImage.startsWith('blob:')) {
      URL.revokeObjectURL(capturedImage);
    }
  });
</script>

<!-- Hidden file input for gallery upload -->
<input
  type="file"
  accept="image/*"
  bind:this={fileInput}
  onchange={handleFileSelect}
  style="display: none;"
/>

<div class="camera-container">
  <header class="header">
    <button class="back-btn" onclick={goBack} aria-label="Go back">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
    <h1 class="header-title">{isReverseSearch ? 'Upload Image' : 'Take a Selfie'}</h1>
    <div class="header-spacer"></div>
  </header>

  <div class="camera-content">
    {#if capturedImage}
      <!-- Preview captured image -->
      <div class="preview-container">
        <img src={capturedImage} alt="Captured" class="preview-image" />
      </div>

      <div class="action-buttons">
        <button class="retake-btn" onclick={retakePhoto} disabled={isUploading}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M17 8.5C17 4.91015 14.0899 2 10.5 2C6.91015 2 4 4.91015 4 8.5C4 12.0899 6.91015 15 10.5 15C11.5 15 12.5 14.8 13.3 14.4M10.5 5V8.5L12.5 10.5M14 13L17 16M17 13V16H14"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          RETAKE
        </button>
        <button class="confirm-btn" onclick={confirmPhoto} disabled={isUploading}>
          {#if isUploading}
            <div class="upload-spinner"></div>
            UPLOADING...
          {:else}
            USE THIS PHOTO
          {/if}
        </button>
      </div>
    {:else}
      <!-- Live camera view -->
      <div class="video-container">
        <video
          bind:this={videoElement}
          autoplay
          playsinline
          muted
          class="video-stream"
          class:mirror={isFrontCamera}
        ></video>
        {#if !cameraActive}
          <div class="camera-loading">
            <div class="spinner"></div>
            <p>Accessing camera...</p>
          </div>
        {/if}
      </div>

      <div class="capture-section">
        <p class="instructions">
          {isReverseSearch
            ? 'Take a photo or upload from gallery'
            : 'Position your face in the frame'}
        </p>

        <div class="camera-controls">
          <!-- Gallery button (left side) -->
          <button class="gallery-btn" onclick={handleGalleryClick} aria-label="Upload from gallery">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 50 50"
              fill="none"
            >
              <circle cx="25" cy="25" r="24.5" stroke="black" stroke-opacity="0.5" />
              <path
                d="M27.5518 16.1943C29.8311 16.1943 31.6369 16.1939 33.0498 16.376C34.5036 16.5634 35.6804 16.9582 36.6084 17.8477C37.5367 18.7374 37.9491 19.8659 38.1445 21.2598C38.3345 22.6141 38.334 24.3445 38.334 26.5293V26.6631C38.334 28.8479 38.3345 30.5792 38.1445 31.9336C37.949 33.3273 37.5366 34.455 36.6084 35.3447C35.6803 36.2344 34.5038 36.6299 33.0498 36.8174C31.6369 36.9994 29.8311 36.999 27.5518 36.999H22.4502C20.1712 36.999 18.366 36.9993 16.9531 36.8174C15.499 36.6299 14.3218 36.2345 13.3936 35.3447C12.4654 34.455 12.0529 33.3273 11.8574 31.9336C11.6674 30.5792 11.668 28.8479 11.668 26.6631V26.5293C11.668 24.3445 11.6675 22.6141 11.8574 21.2598C12.0529 19.8659 12.4654 18.7374 13.3936 17.8477C14.3217 16.9581 15.4991 16.5634 16.9531 16.376C18.366 16.1939 20.1711 16.1943 22.4502 16.1943H27.5518ZM22.5205 17.9775C20.1555 17.9775 18.4748 17.9793 17.2002 18.1436C15.9528 18.3044 15.2338 18.6055 14.709 19.1084C14.1841 19.6115 13.8689 20.301 13.7012 21.4971C13.5666 22.4564 13.537 23.6555 13.5303 25.2236L14.1582 24.6973C15.657 23.4405 17.9161 23.5125 19.3242 24.8623L24.6445 29.9619C25.1772 30.4726 26.0154 30.5421 26.6318 30.127L27.002 29.8779C28.7759 28.6829 31.1764 28.8216 32.7881 30.2119L35.998 32.9814C36.1292 32.6294 36.2288 32.2089 36.3008 31.6953C36.4722 30.4737 36.4736 28.8633 36.4736 26.5967C36.4736 24.3296 36.4722 22.7188 36.3008 21.4971C36.133 20.301 35.8178 19.6115 35.293 19.1084C34.7681 18.6055 34.0492 18.3043 32.8018 18.1436C31.5271 17.9793 29.8465 17.9775 27.4814 17.9775H22.5205ZM31.8223 20.6523C32.8497 20.6523 33.6825 21.4507 33.6826 22.4355C33.6826 23.4203 32.8497 24.2188 31.8223 24.2188C30.7949 24.2187 29.9619 23.4203 29.9619 22.4355C29.962 21.4507 30.7949 20.6524 31.8223 20.6523ZM27.3574 12.334C29.1769 12.334 30.6368 12.3332 31.7832 12.4805C32.9703 12.6329 33.9601 12.9582 34.7451 13.708C35.168 14.1118 35.4619 14.5726 35.668 15.0889C35.0613 14.8481 34.3869 14.6981 33.6416 14.6016C32.1958 14.4143 30.3487 14.414 28.0166 14.4141H22.7959C20.4638 14.414 18.6166 14.4143 17.1709 14.6016C16.3176 14.7121 15.557 14.8926 14.8848 15.1992C15.0925 14.638 15.3978 14.1405 15.8506 13.708C16.6356 12.9582 17.6253 12.6329 18.8125 12.4805C19.9589 12.3333 21.4188 12.334 23.2383 12.334H27.3574Z"
                fill="white"
              />
            </svg>
          </button>

          <!-- Capture button (center) -->
          <button
            class="capture-btn"
            onclick={capturePhoto}
            disabled={!cameraActive || isProcessing}
            aria-label="Capture photo"
          >
            <div class="capture-icon"></div>
          </button>

          <!-- Camera controls overlay -->
          {#if isReverseSearch && cameraActive}
            <button class="gallery-btn" onclick={toggleCamera} aria-label="Toggle camera">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 5H17L15 3H9L7 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18Z"
                  fill="white"
                />
                <path
                  d="M12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z"
                  fill="black"
                />
                <path
                  d="M18.5 9C18.22 9 18 8.78 18 8.5C18 8.22 18.22 8 18.5 8C18.78 8 19 8.22 19 8.5C19 8.78 18.78 9 18.5 9Z"
                  fill="white"
                />
              </svg>
            </button>
          {/if}

          <!-- Spacer for symmetry -->
          {#if !isReverseSearch}
            <div class="spacer"></div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Hidden canvas for capturing photo -->
  <canvas bind:this={canvasElement} style="display: none;"></canvas>
</div>

<style>
  .camera-container {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    flex-direction: column;
    z-index: 1112;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.5);
    position: relative;
    z-index: 1;
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
    color: #fff;
  }

  .header-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  .header-spacer {
    width: 40px;
  }

  .camera-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .video-container {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .video-stream {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .video-stream.mirror {
    transform: scaleX(-1);
  }

  .camera-loading {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    color: white;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .capture-section {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  }

  .instructions {
    color: white;
    font-size: 0.875rem;
    margin: 0;
    text-align: center;
  }

  .camera-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 400px;
  }

  .gallery-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .gallery-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  .spacer {
    width: 48px;
  }

  .capture-btn {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 4px solid white;
    background: transparent;
    cursor: pointer;
    padding: 8px;
    transition: all 0.2s;
  }

  .capture-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .capture-btn:not(:disabled):hover {
    transform: scale(1.05);
  }

  .capture-btn:not(:disabled):active {
    transform: scale(0.95);
  }

  .capture-icon {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 50%;
  }

  .preview-container {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .action-buttons {
    position: absolute;
    bottom: 2rem;
    left: 0;
    right: 0;
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding: 0 2rem;
  }

  .retake-btn,
  .confirm-btn {
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .retake-btn {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .confirm-btn {
    background: white;
    color: #111;
    flex: 1;
    justify-content: center;
  }

  .confirm-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .upload-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(0, 0, 0, 0.2);
    border-top-color: #111;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
  }

  @media (max-width: 480px) {
    .capture-btn {
      width: 70px;
      height: 70px;
    }

    .gallery-btn {
      width: 44px;
      height: 44px;
    }

    .spacer {
      width: 44px;
    }
  }
</style>
