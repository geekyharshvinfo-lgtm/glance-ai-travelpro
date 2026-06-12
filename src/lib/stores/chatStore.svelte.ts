/**
 * Chat state store using Svelte 5 runes
 * Backend: Gemini 2.5 Flash via /api/chat server route
 */
import { browser } from '$app/environment';
import { MESSAGE_SENDER, MESSAGE_TYPE, MESSAGE_STATUS, MESSAGE_UI_STATUS, isUserMessage, type MessageI, type ProductItem } from '$lib/types';
import {
  createLoadingMessage,
  isLoadingMessage,
  createOptimisticMessage,
  generateMessageId,
} from '$lib/utils/chat';
import {
  queueState,
  markQueueCompleted,
  addToChatTryOnQueue,
} from '$lib/stores/chatTryOnQueue.svelte';
import { trackEvent } from '$lib/utils/analytics';
import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES, SECTION_NAMES } from '$lib/constants/analytics';
import { userStore } from '$lib/stores/user.svelte';

// Type for prepopulated input (shown in chat input field when navigating from home)
export interface ChatInputPreview {
  text?: string;
  image?: {
    url: string;
    gcsPath?: string;
  };
}

// In-memory conversation history sent to Gemini for multi-turn context
interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

// Chat state using Svelte 5 runes
let messages = $state<MessageI[]>([]);
let inputPreview = $state<ChatInputPreview | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let currentInfluencerId = $state<string | null>(null);
let isTyping = $state(false);
let lastProductImageUrl = $state<string | null>(null);
let lastSelectedProduct = $state<ProductItem | null>(null);
let migrating = $state(false);

// Conversation history for multi-turn Gemini context
let conversationHistory: HistoryEntry[] = [];

// Pending style-me product state
let pendingStyleMeProduct = $state<ProductItem | null>(null);

// Two-phase deferred product selection after selfie
let selfieProductAwaitingReply = $state<ProductItem | null>(null);
let selfieReplyPendingProduct = $state<ProductItem | null>(null);
let selfieReplyMessageId = $state<string | null>(null);

// Session state (kept for component compat — no backend moderation needed)
let sessionEnded = $state(false);
let sessionEndReason = $state<'warnings' | 'minor' | null>(null);
let sessionRestoreTimeRemaining = $state(0);
let warningCount = $state(0);

function makeMessage(
  id: string,
  body: string | null,
  payload: MessageI['content']['payload'],
  suggestions: string[] | null,
  sender: MessageI['sender'],
  type: MessageI['type']
): MessageI {
  const now = Date.now();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    sender,
    type,
    status: MESSAGE_STATUS.COMPLETE,
    uiStatus: MESSAGE_UI_STATUS.PENDING,
    content: { body, payload, suggestions },
  };
}

function addLoadingMessage(): void {
  messages = [...messages, createLoadingMessage()];
  isTyping = true;
}

function removeLoadingMessages(): void {
  messages = messages.filter((m) => !isLoadingMessage(m));
  isTyping = false;
}

/**
 * Call /api/chat and add the AI response to messages
 */
async function callGeminiChat(userText: string, imageUrl?: string): Promise<void> {
  addLoadingMessage();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userText,
        history: conversationHistory,
        ...(imageUrl ? { imageUrl } : {}),
      }),
    });

    const data = await res.json();
    removeLoadingMessages();

    const { reply, products = [], suggestions = [] } = data;

    // Add AI reply to conversation history for next turn
    if (reply) {
      conversationHistory.push({ role: 'assistant', content: reply });
    }

    // Build product payload (ProductItem[]) if products returned
    const productPayload: ProductItem[] | null =
      products.length > 0
        ? products.map((p: { id: string; ppid?: string; imageUrl: string; brand: string; price: string; cta: { text: string; url: string }; message?: string }) => ({
            id: p.id,
            ppid: p.ppid || p.id,
            imageUrl: p.imageUrl,
            brand: p.brand,
            price: p.price,
            cta: p.cta,
            message: p.message || '',
          }))
        : null;

    // Always clear the queue when a response arrives (prevents stuck disabled buttons)
    if (queueState.hasActive) {
      markQueueCompleted();
    }

    const msgId = generateMessageId();

    // Phase 1 → Phase 2: AI replied to selfie, move pending product
    if (selfieProductAwaitingReply) {
      selfieReplyMessageId = msgId;
      selfieReplyPendingProduct = selfieProductAwaitingReply;
      selfieProductAwaitingReply = null;
    }

    const aiMsg = makeMessage(
      msgId,
      reply || null,
      productPayload,
      suggestions.length > 0 ? suggestions : null,
      MESSAGE_SENDER.ASSISTANT,
      productPayload ? MESSAGE_TYPE.PRODUCTS : MESSAGE_TYPE.TEXT
    );
    messages = [...messages, aiMsg];
    loading = false;
  } catch (err) {
    removeLoadingMessages();
    loading = false;
    // Always clear the queue on error so buttons re-enable
    if (queueState.hasActive) {
      markQueueCompleted();
    }
    const errMsg = makeMessage(
      generateMessageId(),
      "Couldn't connect to Shaq's AI. Check your connection and try again.",
      null,
      null,
      MESSAGE_SENDER.ASSISTANT,
      MESSAGE_TYPE.TEXT
    );
    messages = [...messages, errMsg];
    console.error('[ChatStore] callGeminiChat error:', err);
  }
}

/**
 * Initialize chat — shows a greeting from Gemini
 */
async function initChat(influencerId: string): Promise<void> {
  if (!browser) return;

  // Already initialized for this influencer
  if (currentInfluencerId === influencerId && messages.length > 0) return;

  loading = true;
  error = null;
  currentInfluencerId = influencerId;
  conversationHistory = [];
  messages = [];

  await callGeminiChat(
    "Say hello and introduce yourself as Shaq's personal style AI in 1-2 sentences. Ask what the user is looking for today."
  );

  loading = false;
}

/**
 * Send a user message
 */
async function sendUserMessage(
  text: string,
  image?: { url: string; gcsPath?: string },
  displayText?: string
): Promise<void> {
  if (sessionEnded) return;

  // Add user message to history before sending
  conversationHistory.push({ role: 'user', content: displayText || text });

  // Show optimistic user bubble
  const optimistic = createOptimisticMessage(displayText || text, image);
  messages = [...messages, optimistic];

  await callGeminiChat(text, image?.url);
}

/**
 * Send the user's selfie for style advice
 */
async function sendStyleMeMessage(
  profileImage: string,
  gender: string | null,
  pendingProduct?: ProductItem | null
): Promise<boolean> {
  if (sessionEnded) return false;

  const selfieMsg = createOptimisticMessage('Selfie', { url: profileImage });
  messages = [...messages, selfieMsg];

  if (pendingProduct) {
    selfieProductAwaitingReply = pendingProduct;
  }

  const genderHint = gender ? ` The user identifies as ${gender}.` : '';
  const productHint = pendingProduct
    ? ` They want to try on: "${pendingProduct.message || pendingProduct.brand}".`
    : '';

  conversationHistory.push({
    role: 'user',
    content: `[User shared a selfie]${genderHint}${productHint} Please comment on their look and suggest matching items from the catalog.`,
  });

  await callGeminiChat(
    `[User shared a selfie]${genderHint}${productHint} Please comment on their look and suggest matching items from the catalog.`,
    profileImage
  );

  return true;
}

/**
 * Call /api/tryon with the user's selfie + product image and show the result in chat
 */
async function sendChatTryOn(product: ProductItem): Promise<void> {
  const selfieUrl = userStore.profileImage;
  if (!selfieUrl) return;

  addLoadingMessage();

  try {
    const res = await fetch('/api/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selfieUrl,
        productImageUrl: product.imageUrl,
        productName: product.message || product.brand || '',
        productType: '',
        gender: userStore.gender,
      }),
    });

    const data = await res.json();
    removeLoadingMessages();

    if (queueState.hasActive) markQueueCompleted();

    if (!res.ok || data.error) {
      const errMsg = makeMessage(
        generateMessageId(),
        `Couldn't generate the try-on. ${data.error || 'Please try again.'}`,
        null, null,
        MESSAGE_SENDER.ASSISTANT,
        MESSAGE_TYPE.TEXT
      );
      messages = [...messages, errMsg];
      return;
    }

    const imageDataUrl = `data:${data.mimeType};base64,${data.imageData}`;
    const resultMsg = makeMessage(
      generateMessageId(),
      `Here you go! How do you like this look with ${product.message || product.brand || 'this item'}?`,
      [{ id: `tryon-${Date.now()}`, imageUrl: imageDataUrl }],
      ['Show me more looks', 'Find similar items'],
      MESSAGE_SENDER.ASSISTANT,
      MESSAGE_TYPE.IMAGE
    );
    messages = [...messages, resultMsg];

    conversationHistory.push({
      role: 'assistant',
      content: `Generated a try-on image for ${product.message || product.brand}.`,
    });
  } catch (err) {
    removeLoadingMessages();
    if (queueState.hasActive) markQueueCompleted();
    const errMsg = makeMessage(
      generateMessageId(),
      "Try-on failed. Check your connection and try again.",
      null, null,
      MESSAGE_SENDER.ASSISTANT,
      MESSAGE_TYPE.TEXT
    );
    messages = [...messages, errMsg];
    console.error('[ChatStore] sendChatTryOn error:', err);
  }
}

/**
 * Send a product selection — ask Gemini about this specific product
 */
async function sendProductSelection(product: ProductItem): Promise<boolean> {
  if (sessionEnded) return false;

  lastProductImageUrl = product.imageUrl;
  lastSelectedProduct = product;

  const text = `Tell me more about "${product.message || product.brand}" and suggest similar or complementary items.`;
  conversationHistory.push({ role: 'user', content: text });

  await callGeminiChat(text, product.imageUrl);
  return true;
}

/**
 * Send an image query (from Ask sections)
 */
async function sendImageQuery(text: string, imageUrl: string): Promise<void> {
  if (sessionEnded) return;

  const optimistic = createOptimisticMessage(text, { url: imageUrl });
  messages = [...messages, optimistic];

  conversationHistory.push({ role: 'user', content: text });
  await callGeminiChat(text, imageUrl);
}

function setInputPreview(preview: ChatInputPreview | null): void {
  inputPreview = preview;
}

function clearInputPreview(): void {
  inputPreview = null;
}

/**
 * Called after typing animation completes for the selfie-reply message.
 * Sends the pending product selection.
 */
function notifyTypingComplete(messageId: string): void {
  if (!selfieReplyPendingProduct || !selfieReplyMessageId) return;
  if (messageId !== selfieReplyMessageId) return;

  const product = selfieReplyPendingProduct;
  selfieReplyPendingProduct = null;
  selfieReplyMessageId = null;
  const productName = product.brand || product.message || 'product';
  addToChatTryOnQueue(product.id, productName);
  clearInputPreview();
  sendProductSelection(product);
}

function cleanup(): void {
  currentInfluencerId = null;
  messages = [];
  isTyping = false;
  conversationHistory = [];
}

function fullReset(): void {
  cleanup();
  inputPreview = null;
  loading = false;
  migrating = false;
  error = null;
  lastProductImageUrl = null;
  lastSelectedProduct = null;
  pendingStyleMeProduct = null;
  selfieProductAwaitingReply = null;
  selfieReplyPendingProduct = null;
  selfieReplyMessageId = null;
  sessionEnded = false;
  sessionEndReason = null;
  sessionRestoreTimeRemaining = 0;
  warningCount = 0;
}

// No-ops kept for component interface compatibility
function migrateToPath(_influencerId: string, _path: string, _token: string): void {}
function resetForMigration(): void {}
function prefetchChat(_influencerId: string): void {}
function getBanStatus(_influencerId: string): { banned: boolean; timeRemaining: number } {
  return { banned: false, timeRemaining: 0 };
}

export const chatStore = {
  get messages() { return messages; },
  get loading() { return loading; },
  get error() { return error; },
  get connectionStatus() {
    return currentInfluencerId ? ('connected' as const) : ('disconnected' as const);
  },
  get influencerId() { return currentInfluencerId; },
  get messagesPath() {
    return currentInfluencerId ? `gemini/${currentInfluencerId}` : null;
  },
  get isTyping() { return isTyping; },
  get inputPreview() { return inputPreview; },
  get lastProductImageUrl() { return lastProductImageUrl; },
  get lastSelectedProduct() { return lastSelectedProduct; },
  get ready() { return !!currentInfluencerId && !loading; },
  get migrating() { return migrating; },
  get pendingStyleMe() { return pendingStyleMeProduct !== null; },
  get pendingStyleMeProduct() { return pendingStyleMeProduct; },
  get warningCount() { return warningCount; },
  get sessionEnded() { return sessionEnded; },
  get sessionEndReason() { return sessionEndReason; },
  get sessionRestoreTimeRemaining() { return sessionRestoreTimeRemaining; },
  setPendingStyleMe(product: ProductItem | null) { pendingStyleMeProduct = product; },
  sendChatTryOn,
  isUserMessage,
  prefetch: prefetchChat,
  init: initChat,
  sendMessage: sendUserMessage,
  sendStyleMe: sendStyleMeMessage,
  sendProductSelection,
  sendImageQuery,
  setInputPreview,
  clearInputPreview,
  clearConversationCache(_influencerId: string) {},
  migrateToPath,
  resetForMigration,
  fullReset,
  notifyTypingComplete,
  loadConversationFromHistory(_path: string) {},
  getBanStatus,
};
