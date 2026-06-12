/**
 * Chat API service
 *
 * Handles conversation initialization with the backend API.
 */
import { api } from './client';
import { userStore } from '$lib/stores/user.svelte';

export interface ConversationResponse {
  path: string;
  token: string;
}

/**
 * Initialize a conversation and get Firebase auth token and message path
 */
export async function initConversation(influencerId: string): Promise<ConversationResponse> {
  return api.post<ConversationResponse>(
    '/influencers/chat/conversation',
    {},
    {
      headers: {
        'X-Influencer-Id': influencerId,
        ...(userStore.profileId ? { 'X-Profile-Id': userStore.profileId } : {}),
      },
    }
  );
}

export interface ConversationSummary {
  conversationId: string;
  path: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isAnonymous: boolean;
}

export interface ConversationsResponse {
  conversations: ConversationSummary[];
  totalCount: number;
  pageSize: number;
  hasMore: boolean;
  nextCursor?: string;
}

// X-Profile-Id is intentionally omitted here from getConversations and deleteConversation —
// user identity is extracted from the Authorization: Bearer token by the backend.
export async function getConversations(
  influencerId: string,
  pageSize = 10,
  cursor?: string
): Promise<ConversationsResponse> {
  const params = new URLSearchParams({ pageSize: String(pageSize) });
  if (cursor) params.set('cursor', cursor);

  return api.get<ConversationsResponse>(
    `/influencers/chat/conversations?${params.toString()}`,
    {
      headers: {
        'X-Influencer-Id': influencerId,
      },
    }
  );
}

export async function deleteConversation(
  influencerId: string,
  conversationId: string
): Promise<void> {
  return api.delete<void>('/influencers/chat/conversation', {
    headers: {
      'X-Influencer-Id': influencerId,
      'X-Conversation-Id': conversationId,
    },
  });
}

export interface MigrateChatRequest {
  profileId: string;
  path: string;
}

/**
 * Migrate a guest chat conversation to an authenticated user.
 * Called when an existing user logs in and has an active guest conversation.
 */
export async function migrateChat(
  influencerId: string,
  data: MigrateChatRequest
): Promise<ConversationResponse> {
  return api.post<ConversationResponse>('/influencers/chat/migrate', data, {
    headers: {
      'X-Influencer-Id': influencerId,
    },
  });
}
