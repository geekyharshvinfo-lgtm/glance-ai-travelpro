<script lang="ts">
  import BottomSheet from './BottomSheet.svelte';
  import FilledGreenTickIcon from '../icons/FilledGreenTickIcon.svelte';

  interface Props {
    isOpen: boolean;
    isSubmitted: boolean;
    hasSubmittedBefore: boolean;
    onClose: () => void;
    onSubmit: (
      name: string,
      email: string,
      instaHandle: string
    ) => Promise<{ success: boolean; error?: string }>;
  }

  let { isOpen, isSubmitted, hasSubmittedBefore, onClose, onSubmit }: Props = $props();

  let name = $state('');
  let email = $state('');
  let instaHandle = $state('');
  let isLoading = $state(false);
  let errorMessage = $state('');

  function validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async function handleSubmit() {
    if (!name || !email || !instaHandle) {
      errorMessage = 'Please fill in all fields';
      return;
    }

    if (!validateEmail(email)) {
      errorMessage = 'Please enter a valid email address';
      return;
    }

    errorMessage = '';
    isLoading = true;

    try {
      const result = await onSubmit(name, email, instaHandle);

      if (!result.success) {
        errorMessage = result.error || 'Failed to submit application. Please try again.';
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      errorMessage = 'An error occurred. Please try again later.';
    } finally {
      isLoading = false;
    }
  }
</script>

<BottomSheet {isOpen} {onClose} showCloseIcon={false}>
  {#if isSubmitted || hasSubmittedBefore}
    <div class="thank-you-container">
      <FilledGreenTickIcon />
      <div class="congrats-title">
        {isSubmitted ? 'Congratulations!' : 'Already under consideration'}
      </div>
      <div class="ack-text">We're receiving a lot of requests.</div>
      <div class="ack-text">
        Someone from our team will reach out to you as soon as possible.
      </div>
      <div class="submit-btn-container">
        <button class="submit-btn" onclick={onClose}> CLOSE </button>
      </div>
    </div>
  {:else}
    <div class="form-content">
      <div class="header">
        <div class="title">Become a Creator</div>
        <div class="subtitle">Submit your details and our team will reach out to you!</div>
      </div>

      <div class="input-group">
        <div class="label">Your name</div>
        <input class="input" type="text" placeholder="Type in your name" bind:value={name} />
      </div>

      <div class="input-group">
        <div class="label">Email address</div>
        <input class="input" type="email" placeholder="example@gmail.com" bind:value={email} />
      </div>

      <div class="input-group">
        <div class="label">Instagram handle</div>
        <input class="input" type="text" placeholder="Username_123" bind:value={instaHandle} />
      </div>

      <div class="age-disclaimer">
        By clicking "Submit", you confirm that you are above 18 years of age and you consent Glance
        contacting you based on the information provided.
      </div>

      {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
      {/if}

      <div class="submit-btn-container">
        <button class="submit-btn" onclick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'SUBMITTING...' : 'SUBMIT'}
          {#if !isLoading}<span class="arrow">→</span>{/if}
        </button>
      </div>
    </div>
  {/if}
</BottomSheet>

<style>
  .form-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    align-self: stretch;
  }

  .title {
    color: #fff;
    text-align: center;
    font-size: 20px;
    font-style: normal;
    font-weight: 600;
    line-height: 27.467px;
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.64);
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    line-height: 16px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
  }

  .label {
    margin-bottom: 6px;
    color: rgba(255, 255, 255, 0.64);
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
  }

  .input {
    width: 100%;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #444;
    background: #181818;
    color: rgba(255, 255, 255, 0.4);
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 150%;
  }

  .error-message {
    color: #ff4444;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    margin-top: -8px;
  }

  .submit-btn-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .submit-btn {
    width: 50%;
    padding: 14px 0;
    cursor: pointer;
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.2s;
    border-radius: 4px;
    border: 1px solid #fff;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    line-height: 12px;
    letter-spacing: 0.6px;
    text-transform: uppercase;
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .arrow {
    font-size: 1.2rem;
  }

  .thank-you-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .congrats-title {
    color: #fff;
    text-align: center;
    font-size: 16px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px;
  }

  .ack-text {
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: normal;
    letter-spacing: 0.6px;
    width: 80%;
  }

  .age-disclaimer {
    font-weight: 400;
    font-size: 0.62rem;
    line-height: 150%;
    letter-spacing: 0%;
    text-align: center;
    vertical-align: middle;
    color: rgba(255, 255, 255, 0.6);
    margin: 0.5rem auto;
    flex-shrink: 0;
  }
</style>
