<script lang="ts">
  import {
    MESSAGE_TYPE,
    MESSAGE_STATUS,
    isStringArrayPayload,
    isTilePayload,
    isStarterPayload,
    isVtonPayload,
    isProductPayload,
    isImagePayload,
    isSuggestionsPayload,
    type MessageI,
    type TileItem,
    type StarterItem,
    type VtonItem,
    type ProductItem,
    type ImageItem,
    type SuggestionsPayload,
  } from '$lib/types';
  import ChatTextBlock from './ChatTextBlock.svelte';
  import ChatImageBlock from './ChatImageBlock.svelte';
  import ChatSelectionTiles from './ChatSelectionTiles.svelte';
  import ChatSelectionPills from './ChatSelectionPills.svelte';
  import ChatSelectionCta from './ChatSelectionCta.svelte';
  import ChatSelectionVton from './ChatSelectionVton.svelte';
  import ChatSelectionStarter from './ChatSelectionStarter.svelte';
  import ChatProductCards from './ChatProductCards.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import { loginStore, showLoginPopup } from '$lib/stores/login.svelte';
  import {
    onboardingStore,
    startOnboarding,
    setOnboardingStep,
  } from '$lib/stores/onboarding.svelte';
  import { chatStore } from '$lib/stores/chatStore.svelte';
  import { markQueueProcessing } from '$lib/stores/chatTryOnQueue.svelte';
  import GeneratingOverlay from '../common/GeneratingOverlay.svelte';
  import { untrack } from 'svelte';
  import { formatTime } from '$lib/utils/tryOnUtil';
  import { TOTAL_TIME_FOR_TRYON, LOGIN_REQUIRED } from '$lib/config/env';
  import ChatSelfieUpload from './ChatSelfieUpload.svelte';
  import ChatWarningMessage from './ChatWarningMessage.svelte';

  interface Props {
    message: MessageI;
    isUser: boolean;
    onSelection?: (selection: string, id?: string) => void;
    onProductClick?: (product: ProductItem) => void;
    onImageClick?: (imageUrl: string) => void;
    onTypingComplete?: () => void;
    disabled?: boolean;
    animate?: boolean;
    visible?: boolean;
    allowPills?: boolean; // Controls if this message can show pills
  }

  let {
    message,
    isUser,
    onSelection,
    onProductClick,
    onImageClick,
    onTypingComplete,
    disabled = false,
    animate = false,
    visible = true,
    allowPills = true, // Default to true for backward compatibility
  }: Props = $props();

  // Track if pills have been selected to hide them after selection
  let hidePills = $state(false);

  // Extract content from the message
  const body = $derived(message.content.body);
  const payload = $derived(message.content.payload);
  const suggestions = $derived(message.content.suggestions);
  const similarProducts = $derived(message.content.similarProducts);
  const messageType = $derived(message.type);
  const messageStatus = $derived(message.status);
  const isWarning = $derived(message.isWarning || false);
  const warningNumber = $derived(message.warningNumber || 0);
  const isMinor = $derived(message.isMinor || false);
  const isDraft = $derived(
    message.isFinalResponse === false && messageStatus === MESSAGE_STATUS.DRAFT
  );


  // When DRAFT state is detected (generation timer starts), clear the queue to enable other buttons
  let draftQueueCleared = $state(false);
  $effect(() => {
    if (isDraft && !draftQueueCleared) {
      draftQueueCleared = true;
      markQueueProcessing();
    }
  });

  // True when this message has something to render. Empty AI placeholders
  // (created by the backend before the response is ready) collapse to zero
  // height so they don't push the typing indicator down.
  const hasVisibleContent = $derived(
    isDraft || isWarning || isMinor || !!body || payload != null || (suggestions != null && suggestions.length > 0)
  );

  // Track if the text within THIS message has finished typing.
  // Matches ChatTextBlock's animation condition (animate && !isUser) — if text
  // is typing, payload and pills must wait regardless of message type.
  const hasAnimatedText = $derived(animate && !isUser && !!body);
  let textTypingDone = $state(false);

  // payloadReady: gates payload (products/images) after text typing completes
  const payloadReady = $derived(visible && (!hasAnimatedText || textTypingDone));

  // Whether this message has an animating payload (slide-in carousel/images)
  const hasAnimatingPayload = $derived(
    animate && !isUser && payload != null && (isProductPayload(payload) || isImagePayload(payload))
  );

  // suggestionsReady: gates suggestions after the payload slide-in animation completes.
  // If there's no animating payload, suggestions appear with payloadReady.
  let payloadAnimationDone = $state(false);
  const suggestionsReady = $derived(payloadReady && (!hasAnimatingPayload || payloadAnimationDone));

  $effect(() => {
    if (!payloadReady || !hasAnimatingPayload) {
      // Reset when conditions aren't met (e.g., DRAFT → final transition
      // flips payloadReady false→true, clearing the stale flag from DRAFT phase)
      payloadAnimationDone = false;
      return;
    }

    // Match the slide-in CSS transition duration (400ms) + small buffer
    const SLIDE_IN_DURATION_MS = 450;
    const timer = setTimeout(() => {
      payloadAnimationDone = true;
    }, SLIDE_IN_DURATION_MS);

    return () => clearTimeout(timer);
  });

  // Latch: once animate is true for this message, pills should animate even after
  // the parent flips animate to false (which happens when typing completes).
  let wasAnimated = $state(false);
  $effect(() => {
    if (animate) wasAnimated = true;
  });

  function handleTypingDone() {
    textTypingDone = true;
    onTypingComplete?.();
  }

  function handleSelection(selection: string, id?: string, source?: string) {
    // Hide pills only when selection comes from pills
    if (source === 'pills') {
      hidePills = true;
    }
    onSelection?.(selection, id);
  }

  // --- Add Images (selfie) pill logic ---
  let selfiePillSelected = $state(false);
  let pendingSelfieAction = $state<null | 'login' | 'upload-new'>(null);
  // Snapshot of profileImage before upload, used to detect when a NEW image arrives.
  let profileImageBeforeUpload = $state<string | null>(null);

  // Single effect handles both completion and cancellation of selfie flows.
  // Completion: conditions are met (logged in + image) → send style me.
  // Cancellation: onboarding/login closed without completing → reset to show pills again.
  $effect(() => {
    if (!pendingSelfieAction) return;

    const onboardingClosed = !onboardingStore.isActive;
    const loginClosed =
      !loginStore.isPopupVisible &&
      !loginStore.isAgeConsentPopupVisible &&
      !loginStore.loginInProgress;

    // Wait for login flow to fully complete before acting
    if (!loginClosed) return;

    if (pendingSelfieAction === 'login') {
      if (userStore.profileImage) {
        // Selfie available (either after login or after skipping login) → send
        pendingSelfieAction = null;
        selfiePillSelected = true;
        chatStore.sendStyleMe(userStore.profileImage, userStore.gender);
      } else if ((userStore.isLoggedIn || !LOGIN_REQUIRED) && !onboardingStore.isActive) {
        // Authorized but no selfie yet and onboarding not open → open it
        setOnboardingStep('selfie');
        startOnboarding();
      } else if (onboardingClosed && !userStore.profileImage) {
        // Closed without selfie → cancelled
        pendingSelfieAction = null;
      }
    } else if (pendingSelfieAction === 'upload-new') {
      if (userStore.profileImage && userStore.profileImage !== profileImageBeforeUpload) {
        // New selfie uploaded → send
        pendingSelfieAction = null;
        profileImageBeforeUpload = null;
        selfiePillSelected = true;
        chatStore.sendStyleMe(userStore.profileImage, userStore.gender);
      } else if (
        onboardingClosed &&
        (!userStore.profileImage || userStore.profileImage === profileImageBeforeUpload)
      ) {
        // Onboarding closed without new image → cancelled
        pendingSelfieAction = null;
        profileImageBeforeUpload = null;
      }
    }
  });

  function handleSelfiePillClick(pill: string) {
    if (pill === 'Use existing selfie') {
      if (userStore.profileImage) {
        selfiePillSelected = true;
        chatStore.sendStyleMe(userStore.profileImage, userStore.gender);
      }
    } else if (pill === 'Upload new selfie') {
      profileImageBeforeUpload = userStore.profileImage;
      pendingSelfieAction = 'upload-new';
      setOnboardingStep('selfie');
      startOnboarding();
    } else if (pill === 'Upload selfie') {
      pendingSelfieAction = 'login';
      if (LOGIN_REQUIRED && !userStore.isLoggedIn) {
        showLoginPopup({ allowSkip: true });
      } else {
        setOnboardingStep('selfie');
        startOnboarding();
      }
    }
  }

  // Draft → result transition state machine:
  //   idle → draft (generating + preloading) → revealing (wipe animation) → complete
  let revealPhase = $state<'idle' | 'draft' | 'revealing' | 'complete'>('idle');
  let draftBackgroundSnapshot = $state<string | null>(null);

  const showDraftOverlay = $derived(revealPhase === 'draft' || revealPhase === 'revealing');
  const isRevealing = $derived(revealPhase === 'revealing' || revealPhase === 'complete');
  const wasDrafted = $derived(revealPhase !== 'idle');

  const timestamp = $derived(
    typeof message.createdAt === 'number' ? message.createdAt : message.createdAt?.toMillis?.()
  );

  // Phase: idle → draft. Snapshot the product image once on entry (untrack prevents
  // a second try-on's product selection from overwriting this draft's background).
  $effect(() => {
    if (isDraft) {
      revealPhase = 'draft';
      preloadStarted = false;
      draftBackgroundSnapshot = untrack(
        () => chatStore.lastProductImageUrl || userStore.profileImage
      );
    }
  });

  // Phase: draft → revealing / complete (when isDraft flips to false).
  // untrack(revealPhase) prevents this effect re-scheduling on phase change.
  // Non-reactive closure flag — prevents re-entrancy from payload changes mid-flight.
  let preloadStarted = false;
  $effect(() => {
    if (isDraft || untrack(() => revealPhase) !== 'draft') return;

    const images = isImagePayload(payload) ? (payload as ImageItem[]) : null;
    const imageUrl = images?.[0]?.imageUrl;

    if (!imageUrl) {
      revealPhase = 'complete';
      return;
    }

    if (preloadStarted) return;
    preloadStarted = true;

    const img = new Image();
    img.onload = () => {
      revealPhase = 'revealing';
    };
    img.onerror = () => {
      revealPhase = 'complete';
    };
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
      img.src = '';
    };
  });

  // Phase: revealing → complete (wipe animation finished)
  function handleRevealEnd(e: AnimationEvent) {
    if (e.animationName === 'shineReveal') revealPhase = 'complete';
  }

  // Timer for DRAFT state — counts down from TOTAL_TIME_FOR_TRYON
  let draftElapsed = $state(formatTime(TOTAL_TIME_FOR_TRYON));

  $effect(() => {
    if (!isDraft) return;

    const startTime = timestamp || Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = TOTAL_TIME_FOR_TRYON - elapsed;

      if (remaining <= 0) {
        draftElapsed = '00:00';
        clearInterval(interval);
        return;
      }
      draftElapsed = formatTime(remaining);
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<div
  class="message-container"
  class:user={isUser}
  class:ai={!isUser}
  class:empty-placeholder={!hasVisibleContent}
  data-message-id={message.id}
>
  <div class="message-content" class:user-content={isUser} class:ai-content={!isUser}>
    {#if isUser || messageType === MESSAGE_TYPE.OPTIMISTIC}
      <!-- ── USER / OPTIMISTIC: image above text ── -->
      {#if isImagePayload(payload)}
        <ChatImageBlock
          content={payload as ImageItem[]}
          actions={message.actions}
          showActions={message.showActions}
          {isUser}
          {onImageClick}
          hasText={!!body}
        />
      {/if}
      {#if body}
        <ChatTextBlock {body} {isUser} {timestamp} />
      {/if}
    {:else}
      <!-- ── ASSISTANT: body → payload → suggestions ── -->

      {#if isWarning || isMinor}
        <ChatWarningMessage {warningNumber} {isMinor} remainingTime={chatStore.sessionRestoreTimeRemaining} />
      {:else}
        <!-- 1. Body (text with typing animation) -->
        {#if body}
          <ChatTextBlock {body} {isUser} {timestamp} {animate} onTypingComplete={handleTypingDone} />
        {/if}
      {/if}

      {#if !isWarning && !isMinor}
        <!-- 2. Payload (gated by payloadReady — slides in from right) -->
        {#if showDraftOverlay || (messageType === MESSAGE_TYPE.IMAGE && isImagePayload(payload) && !isProductPayload(payload))}
          <div class="slide-in" class:slide-in-visible={payloadReady}>
            <div
              class="tryon-result-wrapper"
              class:revealing={isRevealing}
              onanimationend={handleRevealEnd}
            >
              {#if !isDraft && isImagePayload(payload) && !isProductPayload(payload)}
                <div class="result-layer" class:draft-pending={wasDrafted && !isRevealing}>
                  <ChatImageBlock
                    content={payload as ImageItem[]}
                    actions={message.actions}
                    showActions={message.showActions}
                    similarProducts={similarProducts as ProductItem[]}
                    {isUser}
                    {onImageClick}
                    animate={(wasDrafted ? isRevealing : payloadReady) && wasAnimated}
                    showShine={isRevealing}
                  />
                </div>
              {/if}
              {#if showDraftOverlay}
                <div class="draft-overlay" class:wiping={isRevealing}>
                  <div class="draft-image-container">
                    {#if draftBackgroundSnapshot}
                      <img src={draftBackgroundSnapshot} alt="" class="draft-image-blur" />
                    {:else}
                      <div class="draft-image-blur"></div>
                    {/if}
                    <GeneratingOverlay elapsedTime={draftElapsed} />
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {:else if messageType === MESSAGE_TYPE.STARTER && isStarterPayload(payload)}
          <ChatSelectionStarter
            content={payload as StarterItem[]}
            onSelect={handleSelection}
            {disabled}
          />
        {:else if messageType === MESSAGE_TYPE.TILES && isTilePayload(payload)}
          <ChatSelectionTiles content={payload as TileItem[]} onSelect={handleSelection} {disabled} />
        {:else if messageType === MESSAGE_TYPE.CTA && isStringArrayPayload(payload)}
          <ChatSelectionCta
            content={payload as string[]}
            onSelect={(s) => handleSelection(s)}
            {disabled}
          />
        {:else if messageType === MESSAGE_TYPE.VTON && isVtonPayload(payload)}
          <ChatSelectionVton
            content={payload as VtonItem[]}
            timer={message.timer}
            onSelect={handleSelection}
            {disabled}
            messageId={message.id}
          />
        {:else if (messageType === MESSAGE_TYPE.PRODUCTS || messageType === MESSAGE_TYPE.TEXT || messageType === MESSAGE_TYPE.IMAGE) && isProductPayload(payload)}
          <div class="slide-in" class:slide-in-visible={payloadReady}>
            <ChatProductCards
              content={payload as ProductItem[]}
              {onProductClick}
              animate={payloadReady}
            />
          </div>
        {/if}

      {/if}
      <!-- End of !isWarning && !isMinor block -->

      <!-- 3. Suggestions (gated by suggestionsReady — waits for payload animation) -->
      {#if suggestionsReady && !isWarning && !isMinor}
        {#if messageType === MESSAGE_TYPE.ADD_IMAGES && !selfiePillSelected && allowPills}
          <div class="pills-wrapper">
            <ChatSelfieUpload
              {disabled}
              {wasAnimated}
              onSelect={(s) => handleSelfiePillClick(s)}
              selfieUrl={userStore.profileImage}
            />
          </div>
        {/if}
        {#if ((suggestions && suggestions.length > 0) || isSuggestionsPayload(payload)) && !hidePills && allowPills}
          {@const pillItems = suggestions || (payload as SuggestionsPayload).suggestions}
          <div class="pills-wrapper">
            <ChatSelectionPills
              content={pillItems}
              onSelect={(s) => handleSelection(s, undefined, 'pills')}
              {disabled}
              animate={wasAnimated}
            />
          </div>
        {/if}
      {/if}
    {/if}
  </div>
</div>

<style>
  .message-container {
    display: flex;
    padding: 0.5rem 1.5rem;
    width: 100%;
  }

  .message-container.user {
    justify-content: flex-end;
  }

  .message-container.ai {
    justify-content: flex-start;
  }

  .message-container.empty-placeholder {
    padding: 0;
    height: 0;
    overflow: hidden;
  }

  .message-content {
    max-width: 100%;
  }

  .message-content.user-content {
    max-width: 17.75rem;
  }

  .message-content.ai-content {
    border-radius: 0.75rem 0.75rem 0.75rem 0.25rem;
    width: 100%;
  }

  /* Payload: slide in from right */
  .slide-in {
    translate: 40% 0;
    opacity: 0;
    transition:
      translate 400ms cubic-bezier(0.16, 1, 0.3, 1),
      opacity 300ms ease;
  }

  .slide-in-visible {
    translate: 0 0;
    opacity: 1;
  }

  /* Draft → result overlay dissolve */
  .tryon-result-wrapper {
    display: grid;
  }

  .result-layer,
  .draft-overlay {
    grid-area: 1 / 1;
  }

  .draft-overlay {
    z-index: 1;
    pointer-events: none; 
  }

  /* Hide result layer until the wipe reveal starts */
  .result-layer.draft-pending {
    visibility: hidden;
  }

  /* Overlay wipe: 45° diagonal sweep from top-left to bottom-right */
  .draft-overlay.wiping {
    will-change: mask-position;
    -webkit-mask: linear-gradient(135deg, transparent 50%, black 50%);
    mask: linear-gradient(135deg, transparent 50%, black 50%);
    -webkit-mask-size: 300% 300%;
    mask-size: 300% 300%;
    -webkit-mask-position: 100% 100%;
    mask-position: 100% 100%;
    animation: wipeOverlay 600ms ease-out forwards;
  }

  @keyframes wipeOverlay {
    to {
      -webkit-mask-position: 0% 0%;
      mask-position: 0% 0%;
    }
  }

  /* Pills/suggestions wrapper — negative margin for full-bleed */
  .pills-wrapper {
    margin: 0 -1.5rem;
  }

  /* DRAFT state — Generating Your Look */
  .draft-image-container {
    position: relative;
    width: 14rem; /* 224px */
    height: 24.8rem; /* 398px */
    border-radius: 0.75rem;
    margin-top: 0.75rem;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .draft-image-blur {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%);
  }

  img.draft-image-blur {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: blur(24px);
    transform: scale(1.15); /* prevent blur white edges */
  }
</style>
