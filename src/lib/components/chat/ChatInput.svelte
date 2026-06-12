<script lang="ts">
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { reverseSearchStore, clearReverseSearchImage } from '$lib/stores/reverseSearch.svelte';
  import { openCameraForReverseSearch } from '$lib/stores/cameraOverlay.svelte';
  import { onDestroy } from 'svelte';

  interface ChatInputProps {
    onSend: (
      message: string,
      image?: { url: string; gcsPath?: string },
      displayText?: string,
      metadataImageUrl?: string
    ) => void;
    disabled?: boolean;
  }

  let { onSend, disabled = false }: ChatInputProps = $props();

  // Initialize input value from preview text if available
  let inputValue = $state(chatStore.inputPreview?.text ?? '');

  // Track if we've already initialized from preview to avoid resetting on re-renders
  let initializedFromPreview = $state(false);

  // Text input reference for focus management (optional)
  let textInputRef: HTMLInputElement | null = null;

  // Watch for reverse search image changes
  $effect(() => {
    if (reverseSearchStore.imageUrl) {
      // Set input preview when image is uploaded via camera
      chatStore.setInputPreview({
        text: inputValue || 'Find me something similar',
        image: {
          url: reverseSearchStore.imageUrl,
          gcsPath: reverseSearchStore.gcsUrl,
        },
      });
    }
  });

  // Update input value when preview changes (only once per preview)
  $effect(() => {
    const preview = chatStore.inputPreview;

    if (preview?.text && !initializedFromPreview) {
      inputValue = preview.text;
      initializedFromPreview = true;

      if (textInputRef && !disabled) {
        textInputRef.focus();
      }
    }
    if (!preview) {
      initializedFromPreview = false;
      inputValue = '';
    }
  });

  const hasText = $derived(inputValue.trim().length > 0);
  const hasImage = $derived(chatStore.inputPreview?.image !== undefined);
  const isSessionEnded = $derived(chatStore.sessionEnded);
  const isActive = $derived(hasText && !disabled && !isSessionEnded);
  const canUpload = $derived(!disabled && !hasImage && !isSessionEnded);
  const inputPlaceholder = $derived(
    isSessionEnded ? 'Chat session ended' : 'What are you looking for?'
  );

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!isActive) return;

    const preview = chatStore.inputPreview;

    if (preview?.image) {
      // Image query — send image URL in metadata, not as payload
      onSend(inputValue, undefined, undefined, preview.image.url);
    } else {
      onSend(inputValue);
    }

    inputValue = '';
    chatStore.clearInputPreview();
    clearReverseSearchImage();
  }

  function removeImage() {
    chatStore.clearInputPreview();
    clearReverseSearchImage();
    inputValue = '';
  }

  function openImageUpload() {
    openCameraForReverseSearch();
  }

  onDestroy(() => {
    // Cleanup handled by reverseSearchStore
  });
</script>

<form class="chat-input-form" class:has-image={hasImage} onsubmit={handleSubmit}>
  {#if hasImage}
    <div class="image-preview">
      <div class="preview-image-container">
        <img src={chatStore.inputPreview?.image?.url} alt="Preview" class="preview-image" />
        <button type="button" class="remove-btn" onclick={removeImage} aria-label="Remove image">
          <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
            <path d="M1 1L5 5M5 1L1 5" stroke="white" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
  {/if}

  <div class="input-row">
    <input
      name="message"
      type="text"
      bind:value={inputValue}
      bind:this={textInputRef}
      placeholder={inputPlaceholder}
      class="chat-text-input"
      disabled={disabled || isSessionEnded}
    />
    <button
      type="button"
      class="file-upload-btn"
      class:active={canUpload}
      disabled={!canUpload}
      aria-label="Upload image"
      onclick={openImageUpload}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="14"
        viewBox="0 0 12 14"
        fill="none"
      >
        <path
          d="M10.9654 5.87541C10.7607 5.69758 10.4506 5.71932 10.2728 5.92397L5.65753 11.2352C4.70871 12.3271 3.05583 12.443 1.96393 11.4942C0.872028 10.5454 0.756137 8.89252 1.70495 7.80062L7.07155 1.62472C7.35622 1.29713 7.75935 1.09604 8.19228 1.06569C8.62521 1.03533 9.05246 1.1782 9.38005 1.46286C9.70764 1.74752 9.90874 2.15066 9.93909 2.58359C9.96944 3.01652 9.82658 3.44377 9.54191 3.77136L5.03397 8.95912C4.79784 9.23086 4.38231 9.25999 4.11057 9.02386C3.83883 8.78773 3.80969 8.3722 4.04582 8.10046L7.80245 3.77733C7.98028 3.57268 7.95854 3.26262 7.75389 3.08478C7.54924 2.90695 7.23917 2.92869 7.06134 3.13334L3.30472 7.45647C3.02005 7.78406 2.87719 8.21131 2.90754 8.64424C2.93789 9.07717 3.13899 9.48031 3.46658 9.76497C3.79417 10.0496 4.22142 10.1925 4.65435 10.1621C5.08728 10.1318 5.49041 9.9307 5.77508 9.60311L10.283 4.41535C11.2318 3.32346 11.1159 1.67057 10.024 0.721754C8.93215 -0.227061 7.27926 -0.111169 6.33045 0.98073L0.963844 7.15663C-0.341314 8.65861 -0.182044 10.9302 1.31993 12.2353C2.82191 13.5405 5.09348 13.3812 6.39863 11.8792L11.0139 6.56797C11.1917 6.36331 11.17 6.05325 10.9654 5.87541Z"
          fill="white"
          stroke="white"
          stroke-width="0.16"
        />
      </svg>
    </button>
    <button
      type="submit"
      class="send-btn"
      class:active={isActive}
      disabled={!isActive}
      aria-label="Send message"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 17L17 7M17 7H8M17 7V16"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</form>

<style>
  .chat-input-form {
    display: flex;
    flex-direction: column;
    padding: 0.6875rem 1.375rem; /* 11px 22px */
    background: #1a1a1a;
    position: sticky;
    bottom: 0;
    border-top: 1px solid #2a2a2a;
    box-shadow: 0px 0px 18.73px 0px rgba(157, 53, 255, 0.17);
  }

  .chat-input-form.has-image {
    padding-top: 1rem;
  }

  .image-preview {
    margin-bottom: 0.75rem; /* 12px */
  }

  .preview-image-container {
    position: relative;
    display: inline-block;
  }

  .preview-image {
    width: 3.5rem; /* 56px */
    height: 3.5rem; /* 56px */
    border-radius: 0.5rem; /* 8px */
    border: 0.03125rem solid #750bff; /* 0.5px */
    object-fit: cover;
    background: #2a2a2a;
  }

  .remove-btn {
    position: absolute;
    top: -0.5rem; /* -8px */
    right: -0.5rem; /* -8px */
    width: 1.5rem; /* 24px */
    height: 1.5rem; /* 24px */
    background: #000;
    border: 0.0625rem solid white; /* 1px */
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .chat-text-input {
    flex: 1;
    padding: 0.5rem 0; /* 8px 0 */
    border: none;
    font-weight: 400;
    font-size: 0.875rem;
    outline: none;
    background: transparent;
    color: #fff;
  }

  .chat-text-input::placeholder {
    color: #666;
  }

  .file-upload-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.875rem; /* 30px */
    height: 1.875rem; /* 30px */
    background: #333;
    border: none;
    border-radius: 50%;
    cursor: not-allowed;
    flex-shrink: 0;
    transition: background 0.2s ease;
  }
  .file-upload-btn:disabled {
    opacity: 0.6;
  }

  .file-upload-btn.active {
    background: #750bff;
    cursor: pointer;
  }

  .file-upload-btn:not(:disabled):hover {
    background: #8a2fff;
  }

  .send-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.875rem; /* 30px */
    height: 1.875rem; /* 30px */
    background: #333;
    border: none;
    border-radius: 50%;
    cursor: not-allowed;
    flex-shrink: 0;
    transition: background 0.2s ease;
  }

  .send-btn:disabled {
    opacity: 0.6;
  }

  .send-btn.active {
    background: #750bff;
    cursor: pointer;
  }

  .send-btn:not(:disabled):hover {
    background: #8a2fff;
  }
</style>
