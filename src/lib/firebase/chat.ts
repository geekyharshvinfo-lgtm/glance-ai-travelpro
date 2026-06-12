/**
 * Chat service with Firestore real-time messaging
 *
 * Provides functions for sending messages and subscribing to real-time updates.
 * Uses paths provided by the backend API.
 *
 * Schema matches glance-ai-embed format directly (no conversion layer).
 */
import {
  collection,
  addDoc,
  query,
  orderBy,
  limitToLast,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestoreInstance, isFirebaseAvailable } from './index';
import * as Sentry from '@sentry/sveltekit';
import {
  MESSAGE_TYPE,
  MESSAGE_SENDER,
  MESSAGE_STATUS,
  type MessageI,
  type MessageType,
  type MessageSender,
  type MessageStatus,
  type ProductItem,
} from '$lib/types';
import { trackEvent } from '$lib/utils/analytics';
import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, PAGE_NAMES } from '$lib/constants/analytics';

// Backend data array item (new format)
interface BackendDataContentItem {
  id?: string;
  text?: string;
  imageUrl?: string;
  gcsPath?: string;
  message?: string;
  brand?: string;
  price?: string;
  ppid?: string;
  cta?: { text: string; url: string };
  url?: string;
  name?: string;
  metadata?: { gcsPath?: string };
  faceDetected?: boolean;
  gender?: string;
  type?: string;
}

interface BackendDataItem {
  type: string;
  subtype?: string;
  content?: BackendDataContentItem[];
  similarProducts?: ProductItem[]; // For "Try On in chat" feature
  timer?: unknown;
}

/**
 * Parse a Firestore timestamp value (Timestamp object, ISO string, or number) to milliseconds
 */
function parseTimestamp(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'string') return new Date(value).getTime();
  return (value as number) || Date.now();
}

// Firestore message interface for sending (matches backend schema)
interface FirestoreMessageInput {
  type: MessageType;
  sender: MessageSender;
  status: MessageStatus;
  chatType: string;
  content: {
    body?: string | null;
    header?: string | null;
    payload?: unknown | null;
    footer?: string | null;
  };
  replyFor?: string | null;
  metadata?: Record<string, unknown> | null;
  timestamp: ReturnType<typeof serverTimestamp>;
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
}

/**
 * Send a text message from the user using the path from backend API
 * @param messagesPath - Full Firestore path to messages collection
 * @param text - The message text
 * @param influencerId - The influencer ID (required for all user messages)
 * @param sessionId - The backend session ID (required for all user messages)
 * @param image - Optional image attachment
 */
export async function sendMessageToPath(
  messagesPath: string,
  text: string,
  influencerId: string,
  sessionId: string,
  image?: { url: string; gcsPath?: string },
  displayText?: string
): Promise<MessageI | null> {
  // Validate mandatory metadata fields
  if (!influencerId || !influencerId.trim()) {
    console.error('[Firestore] influencerId is mandatory for all user messages');
    throw new Error('influencerId is required');
  }
  if (!sessionId || !sessionId.trim()) {
    console.error('[Firestore] sessionId is mandatory for all user messages');
    throw new Error('sessionId is required');
  }

  const db = getFirestoreInstance();
  if (!db) {
    return null;
  }

  // Create message matching glance-ai-embed schema
  const firestoreData: FirestoreMessageInput = {
    type: image ? MESSAGE_TYPE.IMAGE : MESSAGE_TYPE.TEXT,
    sender: MESSAGE_SENDER.USER,
    status: MESSAGE_STATUS.PENDING,
    chatType: 'influencer',
    content: image
      ? {
          body: text || null,
          ...(displayText ? { displayBody: displayText } : {}),
          payload: [
            {
              id: `img-user-${Date.now()}`,
              imageUrl: image.url,
              ...(image.gcsPath ? { gcsPath: image.gcsPath } : {}),
            },
          ],
        }
      : {
          body: text,
          ...(displayText ? { displayBody: displayText } : {}),
        },
    metadata: {
      influencerId,
      sessionId,
      device_type: 'web',
    },
    timestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const messagesRef = collection(db, messagesPath);
    const docRef = await addDoc(messagesRef, firestoreData);

    // Return in MessageI format for local state
    const now = Date.now();
    return {
      id: docRef.id,
      createdAt: now,
      updatedAt: now,
      content: firestoreData.content as MessageI['content'],
      sender: MESSAGE_SENDER.USER,
      type: firestoreData.type,
      status: MESSAGE_STATUS.PENDING,
      metadata: firestoreData.metadata,
    };
  } catch (error) {
    console.error('[Firestore] Send error:', error);
    Sentry.captureException(error, { tags: { operation: 'firestore_send' } });
    return null;
  }
}

/**
 * Handle new backend format with data array structure
 */
function handleNewBackendFormat(docId: string, data: Record<string, unknown>): MessageI {
  const dataArray = data.data as BackendDataItem[];

  // Extract text content
  const textItem = dataArray.find((item) => item.type === 'text');
  let messageBody = '';
  if (textItem && textItem.content && textItem.content.length > 0) {
    // Text content might be in different structures, handle safely
    const textContent = textItem.content[0];
    messageBody = textContent?.text || '';
  }

  // Extract suggestions (pills)
  const pillsItem = dataArray.find(
    (item) => item.type === 'selectionInput' && item.subtype === 'pills'
  );
  let suggestions: string[] | null = null;
  if (pillsItem && pillsItem.content && Array.isArray(pillsItem.content)) {
    suggestions = pillsItem.content.map((item) => item.text).filter(Boolean) as string[];
  }

  // Extract products
  const productItem = dataArray.find(
    (item) => item.type === 'selectionInput' && item.subtype === 'pdt'
  );
  let products: ProductItem[] | null = null;
  if (productItem && productItem.content && Array.isArray(productItem.content)) {
    products = productItem.content
      .map(
        (item, index) =>
          ({
            id: item.id || `product-${docId}-${index}`,
            ppid: item.ppid || '',
            imageUrl: item.imageUrl || '',
            brand: item.brand || '',
            price: item.price || '',
            cta: {
              text: item.cta?.text || 'Buy Now',
              url: item.cta?.url || item.url || '',
            },
            message: item.message || item.name || '',
            gender: item.gender || '',
          }) as ProductItem
      )
      .filter((product) => product.imageUrl); // Only include products with valid imageUrl
  }

  // Extract generated/uploaded images (type: "image" in data array)
  // Use reverse find: backend may send multiple image items — the last one has the signed URL
  const imageItem = [...dataArray].reverse().find((item) => item.type === 'image') ?? null;
  let images: { id: string; imageUrl: string; gcsPath?: string }[] | null = null;
  if (imageItem && imageItem.content && Array.isArray(imageItem.content)) {
    images = imageItem.content
      .filter((item) => item.imageUrl)
      .map((item, index) => ({
        id: item.id || `img-${docId}-${index}`,
        imageUrl: item.imageUrl!,
        gcsPath: item.metadata?.gcsPath || item.gcsPath,
      }));
  }

  // Extract similar products (for "Try On in chat" feature)
  // Reuse imageItem (already the last image entry) and deduplicate by id
  let similarProducts: ProductItem[] | null = null;
  if (
    imageItem &&
    imageItem.similarProducts &&
    Array.isArray(imageItem.similarProducts)
  ) {
    const seen = new Set<string>();
    similarProducts = imageItem.similarProducts.reduce<ProductItem[]>((acc, item) => {
      if (!item.imageUrl || !item.brand || !item.price) return acc;
      if (item.id && seen.has(item.id)) return acc;
      if (item.id) seen.add(item.id);
      acc.push({
        id: item.id || '',
        ppid: item.ppid || '',
        imageUrl: item.imageUrl || '',
        brand: item.brand || '',
        price: item.price || '',
        cta: {
          text: item.cta?.text || 'Buy Now',
          url: item.cta?.url || '',
        },
        message: item.message || '',
        matchType: item.matchType || '',
      } as ProductItem);
      return acc;
    }, []);
  }

  // Check for addImages subtype (agent asking user to provide selfie)
  const addImagesItem = dataArray.find((item) => item.subtype === 'addImages');

  // Check for warning subtype (policy violation warnings)
  const warningItem = dataArray.find(
    (item) => item.type === 'text' && item.subtype === 'INAPPROPRIATE'
  );

  // Check for minor subtype (minor-related violations - ends session immediately)
  const minorItem = dataArray.find(
    (item) => item.type === 'text' && item.subtype === 'MINOR'
  );

  // Extract profile image (selfie upload)
  const profileImageItem = dataArray.find(
    (item) => item.type === 'selectionInput' && item.subtype === 'profileImage'
  );
  let profileImages: { id: string; imageUrl: string; gcsPath?: string }[] | null = null;
  if (profileImageItem && profileImageItem.content && Array.isArray(profileImageItem.content)) {
    profileImages = profileImageItem.content
      .filter((item) => item.imageUrl)
      .map((item, index) => ({
        id: item.id || `selfie-${docId}-${index}`,
        imageUrl: item.imageUrl!,
        gcsPath: item.gcsPath,
      }));
    // Use the message from the first content item as body text
    if (!messageBody && profileImageItem.content[0]?.message) {
      messageBody = profileImageItem.content[0].message;
    }
  }

  const createdAt = parseTimestamp(data.createdAt);
  const updatedAt = parseTimestamp(data.updatedAt);

  // Extract sender/status (same as existing logic)
  const validSenders = Object.values(MESSAGE_SENDER);
  const validStatuses = Object.values(MESSAGE_STATUS);
  const validTypes = Object.values(MESSAGE_TYPE);

  const senderType = data.sender as MessageSender;
  const sender = validSenders.includes(senderType) ? senderType : MESSAGE_SENDER.ASSISTANT;

  const state = data.status as MessageStatus;
  const status = validStatuses.includes(state) ? state : MESSAGE_STATUS.COMPLETE;

  let type = validTypes.includes(data.type as MessageType)
    ? (data.type as MessageType)
    : MESSAGE_TYPE.TEXT;

  let showActions = false; // Flag to determine if action buttons should be shown (e.g., for generated images)

  // Build content object with text, suggestions, products, and profile images
  const content: MessageI['content'] = {
    body: messageBody || null,
    payload: null,
    suggestions: suggestions && suggestions.length > 0 ? suggestions : null,
    similarProducts: similarProducts && similarProducts.length > 0 ? similarProducts : null,
  };

  // Set payload based on what we found (suggestions are stored separately above)
  if (addImagesItem) {
    // Agent is asking user to provide selfie — render as ADD_IMAGES type
    type = MESSAGE_TYPE.ADD_IMAGES;
  } else if (images && images.length > 0) {
    // Generated/uploaded image from backend — render as IMAGE type
    content.payload = images;
    type = MESSAGE_TYPE.IMAGE;
    showActions = true; // Show action buttons for generated images
  } else if (profileImages && profileImages.length > 0) {
    // Profile image (selfie upload) — render as IMAGE type
    content.payload = profileImages;
    content.body = messageBody || 'this is my uploaded image';
    type = MESSAGE_TYPE.IMAGE;
  } else if (products && products.length > 0) {
    if (sender === MESSAGE_SENDER.USER) {
      // User-sent product selections render as image + text
      content.payload = products.map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
      }));
      content.body = products[0]?.message || null;
      type = MESSAGE_TYPE.IMAGE;
    } else {
      content.payload = products;
    }
  }
  // Suggestions are already stored in content.suggestions (line above).
  // No need to duplicate into payload.

  // Track event for receiving new message
  trackEvent(AnalyticsEventAction.MESSAGE_RECEIVED, {
    [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.CHAT_MESSAGE_RECEIVED,
    [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.CHAT_PAGE,
    [ANALYTICS_EVENT_KEYS.message]: content.body || '',
  });

  return {
    id: docId,
    createdAt: createdAt || Date.now(),
    updatedAt: updatedAt || Date.now(),
    content,
    sender,
    type,
    status,
    replyFor: (data.replyFor as string | null) ?? null,
    uiStatus: data.uiStatus as MessageI['uiStatus'],
    metadata: (data.metadata as Record<string, unknown> | null) ?? null,
    timer: data.timer as MessageI['timer'],
    actions: data.actions as MessageI['actions'],
    showActions,
    isFinalResponse: typeof data.isFinalResponse === 'boolean' ? data.isFinalResponse : undefined,
    isWarning: !!warningItem, // Mark as warning if we find a text item with subtype "INAPPROPRIATE"
    isMinor: !!minorItem, // Mark as minor if we find a text item with subtype "MINOR"
  };
}

/**
 * Convert Firestore document data to MessageI
 * Handles both Timestamp objects and number timestamps
 */

// TODO: We can remove this once new backend format is fully rolled out and old format is deprecated.
function firestoreDocToMessage(docId: string, data: Record<string, unknown>): MessageI {
  // Check if this is the new backend format with data array
  if (data.data && Array.isArray(data.data)) {
    return handleNewBackendFormat(docId, data);
  }

  const createdAt = parseTimestamp(data.createdAt);
  const updatedAt = parseTimestamp(data.updatedAt);

  // Validate and extract fields with defaults
  const validSenders = Object.values(MESSAGE_SENDER);
  const validStatuses = Object.values(MESSAGE_STATUS);
  const validTypes = Object.values(MESSAGE_TYPE);

  const senderType = data.sender as MessageSender;
  const sender = validSenders.includes(senderType) ? senderType : MESSAGE_SENDER.ASSISTANT;

  const state = data.status as MessageStatus;
  const status = validStatuses.includes(state) ? state : MESSAGE_STATUS.COMPLETE;

  const type = validTypes.includes(data.type as MessageType)
    ? (data.type as MessageType)
    : MESSAGE_TYPE.TEXT;

  // Handle content — may be a string (new image query format) or object (legacy format)
  let rawContent: Record<string, unknown>;
  if (typeof data.content === 'string') {
    rawContent = { body: data.content || '' };
  } else {
    rawContent = (data.content as Record<string, unknown>) || { body: '' };
  }

  // Use displayBody for UI rendering if present (hides hidden prompts from user)
  if (rawContent.displayBody) {
    rawContent.body = rawContent.displayBody;
    delete rawContent.displayBody;
  }

  // Extract image URL from stringified metadata (image query format)
  if (typeof data.metadata === 'string') {
    try {
      const meta = JSON.parse(data.metadata);
      if (meta.image_url) {
        rawContent.payload = [{ id: `meta-img-${docId}`, imageUrl: meta.image_url }];
      }
    } catch {
      // Ignore malformed metadata
    }
  }

  return {
    id: docId,
    createdAt: createdAt || Date.now(),
    updatedAt: updatedAt || Date.now(),
    content: rawContent as MessageI['content'],
    sender,
    type,
    status,
    replyFor: (data.replyFor as string | null) ?? null,
    uiStatus: data.uiStatus as MessageI['uiStatus'],
    metadata: (data.metadata as Record<string, unknown> | null) ?? null,
    timer: data.timer as MessageI['timer'],
    actions: data.actions as MessageI['actions'],
    showActions: false, // Default to false for old format; will be set to true for generated images in new format
    isFinalResponse: typeof data.isFinalResponse === 'boolean' ? data.isFinalResponse : undefined,
  };
}

/**
 * Subscribe to real-time message updates using a path from the backend API
 * @param messagesPath - Full Firestore path to messages collection
 * @param callback - Function to call with updated messages
 * Returns an unsubscribe function
 */
export function subscribeToMessagesAtPath(
  messagesPath: string,
  callback: (messages: MessageI[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  const db = getFirestoreInstance();
  if (!db) {
    return null;
  }

  try {
    const messagesRef = collection(db, messagesPath);
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limitToLast(100));

    // Cache parsed messages by doc ID. On each snapshot, only re-parse documents
    // that were added or modified. Unchanged messages keep the same object reference,
    // preventing unnecessary re-renders in Svelte's keyed {#each} blocks.
    const parsedCache = new Map<string, MessageI>();

    return onSnapshot(
      q,
      (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'removed') {
            parsedCache.delete(change.doc.id);
          } else {
            // 'added' or 'modified' — re-parse
            parsedCache.set(change.doc.id, firestoreDocToMessage(change.doc.id, change.doc.data()));
          }
        }

        // Evict cache entries no longer in the query window (limitToLast).
        // When a new message pushes the oldest out of the 100-doc window,
        // some SDK versions may not emit a 'removed' change for it.
        if (parsedCache.size > snapshot.docs.length) {
          const activeIds = new Set(snapshot.docs.map((d) => d.id));
          for (const id of parsedCache.keys()) {
            if (!activeIds.has(id)) parsedCache.delete(id);
          }
        }

        // Rebuild array in query order, reusing cached objects for unchanged docs
        const messages: MessageI[] = snapshot.docs.map((d) => parsedCache.get(d.id) as MessageI);
        callback(messages);
      },
      (error) => {
        const isPermissionError =
          error.message?.includes('permission') || error.message?.includes('Permission');
        // Permission error will be captured after retry logic fails in chatstore.
        // Capturing non-permission errors here
        if (!isPermissionError) {
          console.error('[Firestore] Subscribe error:', error.message);
          Sentry.captureException(error, { tags: { operation: 'firestore_subscribe' } });
        }
        onError?.(error);
        // Don't call callback([]) — preserve last known messages on error
      }
    );
  } catch (error) {
    console.error('[Firestore] Connection error:', error);
    Sentry.captureException(error, { tags: { operation: 'firestore_connection' } });
    return null;
  }
}

/**
 * Check if chat service is available
 */
export function isChatServiceAvailable(): boolean {
  return isFirebaseAvailable() && getFirestoreInstance() !== null;
}

/**
 * Send a CONTEXT message to initialize the chat session with metadata
 * Follows glance-ai-embed schema: content always has body field
 * @param messagesPath - Full Firestore path to messages collection
 * @param metadata - Metadata to include (influencerId, sessionId, etc.)
 */
export async function sendContextMessage(
  messagesPath: string,
  metadata: { influencerId: string; sessionId: string; [key: string]: unknown }
): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) {
    console.error('[Firestore] Database not available for context message');
    return false;
  }

  // Match glance-ai-embed schema: content always has body field (empty for CONTEXT)
  // Filter out null/undefined sessionId from metadata
  const contextMessage = {
    type: MESSAGE_TYPE.CONTEXT,
    sender: MESSAGE_SENDER.USER,
    status: MESSAGE_STATUS.PENDING,
    chatType: 'influencer',
    content: { body: '' },
    metadata: {
      device_type: 'web',
      ...metadata,
    },
    timestamp: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const messagesRef = collection(db, messagesPath);
    await addDoc(messagesRef, contextMessage);
    console.log('[Firestore] Context message sent with metadata:', metadata);
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to send context message:', error);
    Sentry.captureException(error, { tags: { operation: 'firestore_context_message' } });
    return false;
  }
}

/**
 * Send a "Style it on me" message with the user's profile image
 */
export interface StyleMeMessageParams {
  messagesPath: string;
  sessionId: string;
  profileImage: string;
  gender: string | null;
}

export async function sendStyleMeMessage(params: StyleMeMessageParams): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) {
    console.error('[Firestore] Database not available for style me message');
    return false;
  }

  const { messagesPath, sessionId, profileImage, gender } = params;

  // Extract conversationId from path: "conversations/{id}/messages" -> "{id}"
  const pathParts = messagesPath.split('/');
  const conversationId = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : '';

  const styleMeMessage = {
    conversationId,
    sender: MESSAGE_SENDER.USER,
    status: MESSAGE_STATUS.PENDING,
    chatType: 'influencer',
    receiverId: 'Agent',
    sessionId,
    content: { body: '' },
    type: MESSAGE_TYPE.IMAGE,
    data: [
      {
        type: 'selectionInput',
        subtype: 'profileImage',
        timer: null,
        content: [
          {
            message: 'Selfie',
            imageUrl: profileImage,
            type: 'uploaded',
            id: `content_selfie_${Date.now()}`,
            gcsPath: profileImage,
            faceDetected: true,
            gender: gender || 'unknown',
          },
        ],
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtTimestamp: serverTimestamp(),
    updatedAtTimestamp: serverTimestamp(),
  };

  try {
    const messagesRef = collection(db, messagesPath);
    await addDoc(messagesRef, styleMeMessage);
    console.log('[Firestore] Style me message sent');
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to send style me message:', error);
    Sentry.captureException(error, { tags: { operation: 'firestore_style_me' } });
    return false;
  }
}

/**
 * Send a product selection message when a user clicks on a product
 */
export interface ProductSelectionParams {
  messagesPath: string;
  sessionId: string;
  product: {
    id: string;
    ppid: string;
    imageUrl: string;
    brand: string;
    price: string;
    cta: { text: string; url: string };
    message?: string;
  };
}

export async function sendProductSelectionMessage(
  params: ProductSelectionParams
): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) {
    console.error('[Firestore] Database not available for product selection message');
    return false;
  }

  const { messagesPath, sessionId, product } = params;

  // Extract conversationId from path: "conversations/{id}/messages" -> "{id}"
  const pathParts = messagesPath.split('/');
  const conversationId = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : '';

  const productSelectionMessage = {
    conversationId,
    sender: MESSAGE_SENDER.USER,
    status: MESSAGE_STATUS.PENDING,
    chatType: 'influencer',
    receiverId: 'Agent',
    sessionId,
    content: { body: '' },
    type: MESSAGE_TYPE.VTON,
    data: [
      {
        type: 'selectionInput',
        subtype: 'pdt',
        content: [
          {
            imageUrl: product.imageUrl,
            message: product.message || 'Try On',
            id: product.id,
            cta: {
              text: product.cta.text,
              url: product.cta.url,
            },
            price: product.price,
            ppid: product.ppid,
            brand: product.brand,
          },
        ],
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtTimestamp: serverTimestamp(),
    updatedAtTimestamp: serverTimestamp(),
  };

  try {
    const messagesRef = collection(db, messagesPath);
    await addDoc(messagesRef, productSelectionMessage);
    console.log('[Firestore] Product selection message sent for:', product.brand);
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to send product selection message:', error);
    Sentry.captureException(error, { tags: { operation: 'firestore_product_selection' } });
    return false;
  }
}

/**
 * Send an image query message (Ask flow).
 * Image URL goes in metadata, not as a payload attachment.
 */
export interface ImageQueryParams {
  messagesPath: string;
  sessionId: string;
  influencerId: string;
  text: string;
  imageUrl: string;
}

export async function sendImageQueryMessage(params: ImageQueryParams): Promise<boolean> {
  const db = getFirestoreInstance();
  if (!db) {
    console.error('[Firestore] Database not available for image query message');
    return false;
  }

  const { messagesPath, sessionId, influencerId, text, imageUrl } = params;

  const pathParts = messagesPath.split('/');
  const conversationId = pathParts.length >= 2 ? pathParts[pathParts.length - 2] : '';

  const imageQueryMessage = {
    conversationId,
    sender: MESSAGE_SENDER.USER,
    status: MESSAGE_STATUS.PENDING,
    chatType: 'influencer',
    type: MESSAGE_TYPE.IMAGE,
    content: text || '',
    metadata: JSON.stringify({ image_url: imageUrl }),
    sessionId,
    influencerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const messagesRef = collection(db, messagesPath);
    await addDoc(messagesRef, imageQueryMessage);
    console.log('[Firestore] Image query message sent');
    return true;
  } catch (error) {
    console.error('[Firestore] Failed to send image query message:', error);
    Sentry.captureException(error, { tags: { operation: 'firestore_image_query' } });
    return false;
  }
}

/**
 * Conversation document data structure
 */
export interface ConversationData {
  influencerId?: string;
  userId?: string;
  profileId?: string;
  sessionId?: string;
  conversationId?: string;
  isAnonymous?: boolean;
  createdAt?: string | number;
  updatedAt?: string | number;
  [key: string]: unknown;
}

/**
 * Wait for sessionId to appear on the conversation document using a real-time listener.
 * Resolves as soon as the backend writes the field — no polling needed.
 * @param messagesPath - Full Firestore path to messages collection
 * @param signal - AbortSignal to cancel the wait early
 * @param timeoutMs - Maximum time to wait (default 50s)
 */
export function waitForSessionId(
  messagesPath: string,
  signal?: AbortSignal,
  timeoutMs = 50_000
): Promise<string> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Chat initialization aborted', 'AbortError'));
  }

  const db = getFirestoreInstance();
  if (!db) {
    return Promise.reject(new Error('Firestore not available'));
  }

  const conversationPath = messagesPath.split('/').slice(0, -1).join('/');
  const conversationRef = doc(db, conversationPath);

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    // Centralized cleanup: idempotent via `settled` flag.
    // Clears timeout, abort listener, and snapshot subscription in all paths.
    const refs = { unsub: undefined as (() => void) | undefined };

    const onAbort = () => {
      cleanup();
      reject(new DOMException('Chat initialization aborted', 'AbortError'));
    };

    const cleanup = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      refs.unsub?.();
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Failed to get sessionId from conversation - timeout'));
    }, timeoutMs);

    signal?.addEventListener('abort', onAbort, { once: true });

    refs.unsub = onSnapshot(
      conversationRef,
      (snap) => {
        const data = snap.data();
        if (data?.sessionId) {
          cleanup();
          resolve(data.sessionId as string);
        }
      },
      (err) => {
        cleanup();
        reject(err);
      }
    );
  });
}

/**
 * Get conversation document data from the messages path
 * @param messagesPath - Full Firestore path to messages collection (e.g., "conversations/{id}/messages")
 * @returns The conversation document data or null if not found
 */
export async function getConversationData(messagesPath: string): Promise<ConversationData | null> {
  const db = getFirestoreInstance();
  if (!db) {
    console.error('[Firestore] Database not available');
    return null;
  }

  try {
    // Extract conversation path from messages path
    // e.g., "conversations/{id}/messages" -> "conversations/{id}"
    const pathParts = messagesPath.split('/');
    if (pathParts.length < 2) {
      console.error('[Firestore] Invalid messages path:', messagesPath);
      return null;
    }

    // Remove the last segment ("messages") to get conversation doc path
    const conversationPath = pathParts.slice(0, -1).join('/');
    console.log('[Firestore] Fetching conversation data from:', conversationPath);

    const conversationRef = doc(db, conversationPath);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      console.log('[Firestore] Conversation document does not exist');
      return null;
    }

    const data = conversationSnap.data();
    console.log('[Firestore] Conversation data:', JSON.stringify(data, null, 2));

    const result: ConversationData = {
      ...data,
      createdAt: data.createdAt ? parseTimestamp(data.createdAt) : undefined,
      updatedAt: data.updatedAt ? parseTimestamp(data.updatedAt) : undefined,
    };

    return result;
  } catch (error) {
    console.error('[Firestore] Error fetching conversation data:', error);
    Sentry.captureException(error, { tags: { operation: 'firestore_conversation_data' } });
    return null;
  }
}
