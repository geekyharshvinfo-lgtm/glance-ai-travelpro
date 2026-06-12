<script lang="ts">
  import { userStore } from '$lib/stores/user.svelte';
  import { LOGIN_REQUIRED } from '$lib/config/env';

  interface Props {
    disabled?: boolean;
    wasAnimated?: boolean;
    selfieUrl?: string | null;
    onSelect?: (pill: string) => void;
  }

  let {
    disabled = false,
    wasAnimated: _wasAnimated = false,
    selfieUrl,
    onSelect,
  }: Props = $props();

  function handleAddNewClick() {
    const authorized = !LOGIN_REQUIRED || userStore.isLoggedIn || !!userStore.profileImage;
    if (authorized && userStore.profileImage) {
      onSelect?.('Upload new selfie');
    } else {
      onSelect?.('Upload selfie');
    }
  }

  function handleSelfieClick() {
    // use existing selfie logic here
    onSelect?.('Use existing selfie');
  }
</script>

<div class="selfie-container">
  <button class="selfie-card add-new-card" onclick={handleAddNewClick} {disabled}>
    <div class="plus-icon">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="36"
        height="36"
        viewBox="0 0 36 36"
        fill="none"
      >
        <foreignObject x="0" y="0" width="0" height="0"
          ><div
            xmlns="http://www.w3.org/1999/xhtml"
            style="backdrop-filter:blur(6.5px);clip-path:url(#bgblur_0_3997_4215_clip_path);height:100%;width:100%"
          ></div></foreignObject
        ><g data-figma-bg-blur-radius="13">
          <circle cx="18" cy="18" r="18" fill="#525252" fill-opacity="0.5" />
          <circle
            cx="18"
            cy="18"
            r="17.5"
            stroke="url(#paint0_linear_3997_4215)"
            stroke-opacity="0.6"
          />
          <circle
            cx="18"
            cy="18"
            r="17.5"
            stroke="url(#paint1_linear_3997_4215)"
            stroke-opacity="0.6"
          />
        </g>
        <defs>
          <clipPath id="bgblur_0_3997_4215_clip_path" transform="translate(0 0)"
            ><circle cx="18" cy="18" r="18" />
          </clipPath><linearGradient
            id="paint0_linear_3997_4215"
            x1="2.06369"
            y1="7.39286"
            x2="7.38072"
            y2="11.6301"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="paint1_linear_3997_4215"
            x1="28.8344"
            y1="2.57143"
            x2="41.7181"
            y2="4.68534"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0" />
            <stop offset="1" stop-color="white" />
          </linearGradient>
        </defs>
      </svg>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <span class="add-new-text">Add New</span>
  </button>

  {#if selfieUrl}
    <button class="selfie-card image-card" onclick={handleSelfieClick} {disabled}>
      <img src={selfieUrl} alt="Your selfie" class="selfie-image" />
    </button>
  {/if}
</div>

<style>
  .selfie-container {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 0;
    margin: 0 1.5rem;
  }

  .selfie-card {
    width: 7.5rem; /* 120px */
    height: 10.7rem; /* 170px */
    cursor: pointer;
    display: flex;
    padding: 10px 19px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    border-radius: 8px;
    border: 0.65px solid rgba(255, 255, 255, 0.2);
    background: linear-gradient(
      124deg,
      rgba(255, 255, 255, 0) -0.06%,
      rgba(255, 255, 255, 0.12) 69.56%
    );
  }

  .selfie-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-new-card {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .plus-icon {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .plus-icon svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .add-new-text {
    color: #fff;
    text-align: center;
    font-size: 14px;
    font-style: normal;
    font-weight: 600;
    line-height: 27.467px; /* 196.19% */
  }

  .image-card {
    background: #1c1c1f;
    overflow: hidden;
    padding: 0;
  }

  .selfie-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>
