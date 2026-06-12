<script lang="ts">
  import type { ProductItem } from '$lib/types';
  import { StyleMeWhiteIcon } from '../icons/index';
  import { userStore } from '$lib/stores/user.svelte';
  import { loginStore, showLoginPopup } from '$lib/stores/login.svelte';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import {
    onboardingStore,
    startOnboarding,
    setOnboardingStep,
  } from '$lib/stores/onboarding.svelte';
  import { queueState, addToChatTryOnQueue } from '$lib/stores/chatTryOnQueue.svelte';
  import { setPendingLoginAction } from '$lib/services/loginIntent';
  import { showToast } from '$lib/stores/toast.svelte';
  import { LOGIN_REQUIRED } from '$lib/config/env';

  interface Props {
    content: ProductItem[];
    onProductClick?: (product: ProductItem) => void;
    animate?: boolean;
  }

  let { content, onProductClick, animate = false }: Props = $props();

  // Prevents re-opening onboarding if user cancelled it without uploading
  let onboardingAttempted = $state(false);

  // Watch for login + profile image + chat readiness to complete the pending style me flow.
  // The pending flag lives on chatStore (not this component) so it survives component
  // destruction during chat migration (fullReset clears messages → component remounts).
  $effect(() => {
    if (!chatStore.pendingStyleMe) return;
    const loginFlowActive =
      loginStore.isPopupVisible ||
      loginStore.isAgeConsentPopupVisible ||
      loginStore.loginInProgress;
    // Wait for login/onboarding to finish before proceeding
    if (loginFlowActive || onboardingStore.isActive || !chatStore.ready) {
      return;
    }
    const authorized = !LOGIN_REQUIRED || userStore.isLoggedIn || !!userStore.profileImage;
    if (authorized && userStore.profileImage) {
      // Success case: authorized and has a selfie — run actual try-on
      const product = chatStore.pendingStyleMeProduct;
      chatStore.setPendingStyleMe(null);
      onboardingAttempted = false;
      if (product) {
        addToChatTryOnQueue(product.id, product.brand || product.message || 'product');
        chatStore.sendChatTryOn(product);
      } else {
        chatStore.sendStyleMe(userStore.profileImage, userStore.gender, undefined);
      }
    } else if (authorized && !userStore.profileImage && !onboardingAttempted) {
      // Re-prompt case: authorized but no selfie yet
      onboardingAttempted = true;
      setOnboardingStep('selfie');
      startOnboarding();
    } else if (!authorized || !userStore.profileImage) {
      // Cancellation case: not authorized or no selfie after onboarding attempt
      chatStore.setPendingStyleMe(null);
      onboardingAttempted = false;
    }
  });

  function handleProductClick(product: ProductItem) {
    onProductClick?.(product);
  }

  async function handleStyleMeClick(e: Event, product: ProductItem) {
    e.stopPropagation();

    // Check same gender requirement if specified by product
    // console.log('Product gender:', product.gender, 'User gender:', userStore.gender); // Debug log
    let productGender = product.gender ? product.gender.toLowerCase() : null;
    let userGender = userStore.gender ? userStore.gender.toLowerCase() : null;
    if (productGender && userGender && productGender !== 'unisex' && productGender !== userGender) {
      showToast(`This product is only available for ${product.gender} users.`, 'info');
      return;
    }

    if (chatStore.pendingStyleMe) return; // Prevent double-click while pending

    // Check if there's already an item in queue
    if (queueState.hasActive) {
      const productName = queueState.activeItem?.productName || 'another product';
      showToast(`Generation for ${productName} in progress. Please wait!`, 'info');
      return;
    }

    if (LOGIN_REQUIRED && !userStore.isLoggedIn && !userStore.profileImage) {
      chatStore.setPendingStyleMe(product);
      onboardingAttempted = false;
      setPendingLoginAction({
        type: 'styleme',
        product: {
          id: product.id,
          ppid: product.ppid,
          imageUrl: product.imageUrl,
          brand: product.brand,
          price: product.price,
          cta: product.cta,
          message: product.message,
          gender: product.gender,
        },
      });
      showLoginPopup({ allowSkip: true });
      return;
    }

    if (!userStore.profileImage) {
      chatStore.setPendingStyleMe(product);
      onboardingAttempted = false;
      setOnboardingStep('selfie');
      startOnboarding();
      return;
    }

    // Add to queue before sending - this disables other buttons immediately
    const productName = product.brand || product.message || 'product';
    addToChatTryOnQueue(product.id, productName);

    chatStore.clearInputPreview();
    await chatStore.sendChatTryOn(product);
  }
</script>

<div class="products-container">
  {#each content as product, index (product.id)}
    <div
      class="product-card"
      class:animate
      style:animation-delay={animate ? `${index * 100}ms` : '0ms'}
      role="button"
      tabindex="0"
      onclick={() => handleProductClick(product)}
      onkeydown={(e) => e.key === 'Enter' && handleProductClick(product)}
    >
      <div class="product-image-wrapper">
        <img
          src={product.imageUrl}
          alt={product.message || product.brand}
          class="product-image"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="product-details">
        <div class="product-info">
          <p class="product-brand">{product.brand}</p>
          <p class="product-price">{product.price}</p>
        </div>
        <div
          class="style-me-wrapper"
          onclick={(e) => handleStyleMeClick(e, product)}
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && handleStyleMeClick(e, product)}
        >
          <button class="style-me-btn" class:disabled={queueState.hasActive} tabindex="-1">
            <StyleMeWhiteIcon width="0.625rem" height="0.625rem" />
            STYLE ME
          </button>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .products-container {
    display: flex;
    gap: 0.625rem;
    overflow-x: auto;
    padding: 0 1.5rem;
    margin: 0 -1.5rem; /* Negative margin to offset container padding for full bleed effect */
    margin-top: 0.75rem;
    padding-bottom: 0.5rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .products-container::-webkit-scrollbar {
    display: none;
  }

  .product-card {
    flex: 0 0 auto;
    width: 13.5rem;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    background: #1e1e1e;
    overflow: hidden;
    cursor: pointer;
    text-align: left;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .product-card.animate {
    opacity: 0;
    animation: slideIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .product-image-wrapper {
    width: 100%;
    height: 20rem;
    overflow: hidden;
    background: #111;
  }

  .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .product-details {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    gap: 0.375rem;
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 0.0625rem;
    overflow: hidden;
    min-width: 0;
  }

  .product-brand {
    font-size: 0.625rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
  }

  .product-price {
    font-size: 0.8125rem;
    font-weight: 700;
    color: white;
  }

  .style-me-wrapper {
    cursor: pointer;
    flex-shrink: 0;
  }

  .style-me-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(94.33deg, #111111 0%, #424242 98.94%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    color: white;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;
    pointer-events: none;
  }

  .style-me-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .style-me-wrapper:has(.style-me-btn.disabled) {
    cursor: not-allowed;
  }
</style>
