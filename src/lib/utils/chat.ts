/**
 * Chat utility functions
 *
 * Helper functions for creating and manipulating chat messages.
 */
import { ACTION_TYPES, ANALYTICS_EVENT_KEYS, AnalyticsEventAction, EVENT_TYPES, PAGE_NAMES } from '$lib/constants/analytics';
import { chatStore } from '$lib/stores/chatStore.svelte';
import {
  MESSAGE_TYPE,
  MESSAGE_SENDER,
  MESSAGE_STATUS,
  MESSAGE_UI_STATUS,
  type MessageI,
  type ImageItem,
} from '$lib/types';
import { trackEvent } from './analytics';

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a user text message
 */
export function createUserTextMessage(
  text: string,
  image?: { url: string; gcsPath?: string }
): MessageI {
  const now = Date.now();

  if (image) {
    return {
      id: generateMessageId(),
      createdAt: now,
      updatedAt: now,
      content: {
        body: text || undefined,
        payload: [
          {
            id: `img-user-${now}`,
            imageUrl: image.url,
            gcsPath: image.gcsPath,
          },
        ] as ImageItem[],
      },
      sender: MESSAGE_SENDER.USER,
      type: MESSAGE_TYPE.IMAGE,
      status: MESSAGE_STATUS.PENDING,
      uiStatus: MESSAGE_UI_STATUS.PENDING,
    };
  }

  return {
    id: generateMessageId(),
    createdAt: now,
    updatedAt: now,
    content: {
      body: text,
    },
    sender: MESSAGE_SENDER.USER,
    type: MESSAGE_TYPE.TEXT,
    status: MESSAGE_STATUS.PENDING,
    uiStatus: MESSAGE_UI_STATUS.PENDING,
  };
}

/**
 * Create a loading/thinking message
 */
export function createLoadingMessage(): MessageI {
  const now = Date.now();
  return {
    id: `loading-${now}`,
    createdAt: now,
    updatedAt: now,
    content: {
      body: 'Thinking...',
    },
    sender: MESSAGE_SENDER.ASSISTANT,
    type: MESSAGE_TYPE.LOADING,
    status: MESSAGE_STATUS.PROCESSING,
  };
}

/**
 * Check if message is a loading message
 */
export function isLoadingMessage(message: MessageI): boolean {
  return message.type === MESSAGE_TYPE.LOADING;
}

/**
 * Create an optimistic message (shown locally before Firestore confirmation)
 */
export function createOptimisticMessage(
  text: string,
  image?: { url: string; gcsPath?: string }
): MessageI {
  const now = Date.now();

  if (image) {
    return {
      id: `optimistic-${now}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      content: {
        body: text || undefined,
        payload: [
          {
            id: `img-user-${now}`,
            imageUrl: image.url,
            gcsPath: image.gcsPath,
          },
        ] as ImageItem[],
      },
      sender: MESSAGE_SENDER.USER,
      type: MESSAGE_TYPE.OPTIMISTIC,
      status: MESSAGE_STATUS.PENDING,
      uiStatus: MESSAGE_UI_STATUS.PENDING,
    };
  }

  return {
    id: `optimistic-${now}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    content: {
      body: text,
    },
    sender: MESSAGE_SENDER.USER,
    type: MESSAGE_TYPE.OPTIMISTIC,
    status: MESSAGE_STATUS.PENDING,
    uiStatus: MESSAGE_UI_STATUS.PENDING,
  };
}

/**
 * Check if message is an optimistic message
 */
export function isOptimisticMessage(message: MessageI): boolean {
  return message.type === MESSAGE_TYPE.OPTIMISTIC;
}

/**
 * Check if two messages match (for deduplication)
 * Used to replace optimistic messages with real Firestore messages
 */
export function messagesMatch(optimistic: MessageI, real: MessageI): boolean {
  // Must be from same sender
  if (optimistic.sender !== real.sender) return false;

  // For image messages, match by image URL (body may differ due to hidden prompts)
  if (optimistic.content.payload && real.content.payload) {
    const optimisticPayload = optimistic.content.payload;
    const realPayload = real.content.payload;

    if (Array.isArray(optimisticPayload) && Array.isArray(realPayload)) {
      if (optimisticPayload.length > 0 && realPayload.length > 0) {
        const optImg = optimisticPayload[0] as ImageItem;
        const realImg = realPayload[0] as ImageItem;
        if (optImg.imageUrl && realImg.imageUrl) {
          return optImg.imageUrl === realImg.imageUrl;
        }
      }
    }
  }

  // Text-only messages match by body
  const optimisticBody = optimistic.content.body?.trim() || '';
  const realBody = real.content.body?.trim() || '';
  return optimisticBody === realBody && optimisticBody !== '';
}

 export function handleChatMessageSend(
    text: string,
    image?: { url: string; gcsPath?: string },
    displayText?: string,
    metadataImageUrl?: string
  ) {
    if (metadataImageUrl) {
      chatStore.sendImageQuery(text, metadataImageUrl);
    } else {
      chatStore.sendMessage(text, image, displayText);
    }

    // Track chat message sent event
    trackEvent(AnalyticsEventAction.CLICKED, {
      [ANALYTICS_EVENT_KEYS.action]: ACTION_TYPES.CHAT_MESSAGE_SENT,
      [ANALYTICS_EVENT_KEYS.eventType]: EVENT_TYPES.CHAT_MESSAGE_SEND_BUTTON_CLICK,
      [ANALYTICS_EVENT_KEYS.pageName]: PAGE_NAMES.CHAT_PAGE,
      [ANALYTICS_EVENT_KEYS.message]: text,
      [ANALYTICS_EVENT_KEYS.imageUrl]: metadataImageUrl,
    });
  }
