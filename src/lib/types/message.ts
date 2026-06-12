/**
 * Chat message types matching glance-ai-embed schema
 */
import type { Timestamp } from 'firebase/firestore';

// Message type constants
export const MESSAGE_TYPE = {
  TEXT: 'TEXT', // Text messages, may include payload.suggestions for pills
  LOADING: 'LOADING',
  OPTIMISTIC: 'OPTIMISTIC', // Local message before Firestore confirmation
  STARTER: 'STARTER',
  TILES: 'TILES',
  CTA: 'CTA',
  VTON: 'VTON',
  ADD_IMAGES: 'ADD_IMAGES',
  PRODUCTS: 'PRODUCTS',
  IMAGE: 'IMAGE',
  CONTEXT: 'CONTEXT', // Context message sent on chat initialization
} as const;

export const MESSAGE_SENDER = {
  USER: 'USER',
  SYSTEM: 'SYSTEM',
  ASSISTANT: 'ASSISTANT',
} as const;

export const MESSAGE_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
  DRAFT: 'DRAFT',
  SUCCESS: 'SUCCESS',
  SUBMITTED: 'SUBMITTED',
} as const;

export const MESSAGE_UI_STATUS = {
  PENDING: 'PENDING',
  RENDERED: 'RENDERED',
} as const;

// Type definitions from constants
export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];
export type MessageSender = (typeof MESSAGE_SENDER)[keyof typeof MESSAGE_SENDER];
export type MessageStatus = (typeof MESSAGE_STATUS)[keyof typeof MESSAGE_STATUS];
export type MessageUIStatus = (typeof MESSAGE_UI_STATUS)[keyof typeof MESSAGE_UI_STATUS];

// Payload item interfaces

export interface TileItem {
  id: string;
  imageUrl: string;
  text: string;
  label?: string;
}

export interface StarterItem {
  id: string;
  type: 'STYLE_ME' | 'CREATE_LOOK';
  message: string;
}

export interface VtonItem {
  id: string;
  imageUrl: string;
  message: string;
}

export type AddImageType = 'UPLOAD' | 'SELECTION' | 'CAMERA' | 'GALLERY';

export interface AddImageItem {
  id: string;
  type: AddImageType;
  imageUrl?: string;
  gcsPath?: string;
}

export interface ProductItem {
  id: string;
  ppid: string;
  imageUrl: string;
  brand: string;
  price: string;
  cta: { text: string; url: string };
  message?: string;
  gender?: string;
  matchType?: 'EXACT' | 'SIMILAR' | '';
}

export interface ImageItem {
  id: string;
  imageUrl: string;
  tag?: string;
  gcsPath?: string;
  products?: {
    id: string;
    ppid: string;
    imageUrl: string;
    brand: string;
    price: string;
  };
  similarProducts?: ProductItem[] | null;
}

// Suggestions payload (for pills display)
export interface SuggestionsPayload {
  suggestions: string[];
}

// Payload types for different message types
export type MessagePayload =
  | string[] // PILLS, CTA
  | TileItem[] // TILES
  | StarterItem[] // STARTER
  | VtonItem[] // VTON
  | AddImageItem[] // ADD_IMAGES
  | ProductItem[] // PRODUCTS
  | ImageItem[] // IMAGE
  | SuggestionsPayload; // Suggestions (pills)

// Message content structure
export interface MessageContent {
  header?: string | null;
  body?: string | null;
  payload?: MessagePayload | null;
  suggestions?: string[] | null;
  footer?: string | null;
  similarProducts?: ProductItem[] | null;
}

// Timer for VTON messages
export interface MessageTimer {
  timeMs: number;
  text: string;
}

// Actions for messages (download, share)
export interface MessageActions {
  download?: { enable: boolean };
  share?: { enable: boolean };
}

// Main message interface
export interface MessageI {
  id: string;
  createdAt: Timestamp | number;
  updatedAt: Timestamp | number;
  content: MessageContent;
  sender: MessageSender;
  type: MessageType;
  status: MessageStatus;
  replyFor?: string | null;
  uiStatus?: MessageUIStatus;
  metadata?: Record<string, unknown> | null;
  timer?: MessageTimer;
  actions?: MessageActions;
  showActions?: boolean; // UI flag to show action buttons
  isFinalResponse?: boolean;
  isWarning?: boolean; // Flag for policy violation warnings
  warningNumber?: number; // Which warning this is (1, 2, or 3) - stored when warning is received
  isMinor?: boolean; // Flag for minor-related violations (ends session immediately)
}

// Type guards for payload types

export function isStringArrayPayload(
  payload: MessagePayload | undefined | null
): payload is string[] {
  return Array.isArray(payload) && (payload.length === 0 || typeof payload[0] === 'string');
}

export function isTilePayload(payload: MessagePayload | undefined | null): payload is TileItem[] {
  return (
    Array.isArray(payload) &&
    payload.length > 0 &&
    typeof payload[0] === 'object' &&
    'imageUrl' in payload[0] &&
    'text' in payload[0]
  );
}

export function isStarterPayload(
  payload: MessagePayload | undefined | null
): payload is StarterItem[] {
  return (
    Array.isArray(payload) &&
    payload.length > 0 &&
    typeof payload[0] === 'object' &&
    'type' in payload[0] &&
    ['STYLE_ME', 'CREATE_LOOK'].includes((payload[0] as StarterItem).type)
  );
}

export function isVtonPayload(payload: MessagePayload | undefined | null): payload is VtonItem[] {
  return (
    Array.isArray(payload) &&
    payload.length > 0 &&
    typeof payload[0] === 'object' &&
    'imageUrl' in payload[0] &&
    'message' in payload[0] &&
    !('text' in payload[0])
  );
}

export function isAddImagePayload(
  payload: MessagePayload | undefined | null
): payload is AddImageItem[] {
  return (
    Array.isArray(payload) &&
    payload.length > 0 &&
    typeof payload[0] === 'object' &&
    'type' in payload[0] &&
    ['UPLOAD', 'SELECTION', 'CAMERA', 'GALLERY'].includes((payload[0] as AddImageItem).type)
  );
}

export function isProductPayload(
  payload: MessagePayload | undefined | null
): payload is ProductItem[] {
  return (
    Array.isArray(payload) &&
    payload.length > 0 &&
    typeof payload[0] === 'object' &&
    'ppid' in payload[0] &&
    'cta' in payload[0]
  );
}

export function isImagePayload(payload: MessagePayload | undefined | null): payload is ImageItem[] {
  return (
    Array.isArray(payload) &&
    payload.length > 0 &&
    typeof payload[0] === 'object' &&
    'imageUrl' in payload[0] &&
    !('text' in payload[0]) &&
    !('message' in payload[0]) &&
    !('ppid' in payload[0])
  );
}

export function isSuggestionsPayload(
  payload: MessagePayload | undefined | null
): payload is SuggestionsPayload {
  return (
    payload !== null &&
    payload !== undefined &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    'suggestions' in payload &&
    Array.isArray(payload.suggestions)
  );
}

// Helper to check if message is from user
export function isUserMessage(message: MessageI): boolean {
  return message.sender === MESSAGE_SENDER.USER;
}
