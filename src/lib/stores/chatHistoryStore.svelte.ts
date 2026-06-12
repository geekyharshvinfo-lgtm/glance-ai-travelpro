interface ChatHistoryState {
  isOpen: boolean;
  influencerId: string | null;
}

export const chatHistoryStore = $state<ChatHistoryState>({
  isOpen: false,
  influencerId: null,
});

export function openChatHistoryDrawer(influencerId: string): void {
  chatHistoryStore.influencerId = influencerId;
  chatHistoryStore.isOpen = true;
}

export function closeChatHistoryDrawer(): void {
  chatHistoryStore.isOpen = false;
}
