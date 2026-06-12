# Chat architecture

Real-time chat over Firestore. Backend issues a per-conversation Firebase custom token; the client subscribes to a path. Schema mirrors `glance-ai-embed` (no conversion layer).

## Files

- `src/lib/stores/chatStore.svelte.ts` — single source of truth (1400 lines, ~50 actions).
- `src/lib/firebase/chat.ts` — Firestore reads/writes + dual-format parsing.
- `src/lib/api/chat.ts` — REST endpoints (`initConversation`, `getConversations`, `migrateChat`, `deleteConversation`).
- `src/lib/types/message.ts` — `MessageI`, `MESSAGE_TYPE`, `MESSAGE_SENDER`, `MESSAGE_STATUS`, payload type guards.
- `src/routes/[slug]/chat/+page.svelte` — view-state derivation + animation tracking.
- `src/lib/components/chat/*` — 19 message-block components.

## Lifecycle

1. **Prefetch.** `[slug]/+layout.svelte:22` fires `chatStore.prefetch(influencerId)` after `userStore.authInitialized` resolves. Runs the full init silently in the background while the user is still on the influencer page.
2. **Adopt.** When the user opens chat, `chatStore.initChat(influencerId)` either:
   - adopts the completed prefetch (if same influencer + fully initialized — `unsubscribe` and `currentBackendSessionId` set), or
   - awaits the in-flight prefetch promise, or
   - starts fresh.
3. **Subscribe.** `subscribeToMessagesAtPath(path, callback)` opens a Firestore listener (`limitToLast(100)`, `orderBy createdAt asc`). Stores `Unsubscribe` in module-level `unsubscribe`.
4. **Send.** `sendMessageToPath` writes a doc to `<path>` (which is `conversations/<id>/messages`) with `serverTimestamp()`. Backend reacts and writes the assistant's response to the same collection.
5. **Migrate.** On Google login, `authService.migrateChatConversation()` resolves the source path: prefers `chatStore.messagesPath` (popup flow, chat is mounted), falls back to `localStorage[chat_conv_guest_<influencerId>]` (redirect flow, chat is not mounted). Strips the `/messages` suffix, calls `migrateChat({ profileId, path: conversationPath })` → new `{ path, token }` → `chatStore.migrateToPath()` does a soft reset + prefetch. Cleans up the guest cache key on success. Failure is non-fatal — chat reinitializes on next visit.
6. **Reset.** `[slug]/+layout.svelte:onDestroy` calls `chatStore.fullReset()`. Same on influencer change (page navigation between two slugs).

## Conversation cache

Path + sessionId cached in `localStorage` under `chat_conv_<profileId|guest>_<influencerId>` for 24 h (`CONVERSATION_CACHE_TTL_MS` at `chatStore.svelte.ts:39`). Profile-scoped so logged-in and guest sessions don't bleed. `cleanupExpiredCaches()` runs once per session to evict stale entries.

The cache lets a returning user reuse the same Firebase session (restored from IndexedDB by `waitForAuthReady`) without calling `initConversation` — saves a round-trip on warm navigations.

## View states (chat page)

`+page.svelte:53` derives state in a single pass over messages:

| State | When |
| --- | --- |
| `loading` | `chatStore.loading` is true (initial init) |
| `migrating` | `chatStore.migrating` is true (guest → user mid-flight) — shows shimmer placeholders |
| `greeting` | Has agent welcome message, no user messages — shows starter tiles |
| `conversation` | User has sent at least one message |

The same pass also computes `welcomeMessageId` (filtered out of the visible list), the visible `messages[]`, and `lastAgentId` (only the last agent message shows pills).

`liveMode` (boolean) flips on once view enters `conversation`. Messages already present at that point are added to `animatedIds` and render instantly. Only messages arriving **after** that point trigger the typing animation.

## Dual Firestore format

`firestoreDocToMessage()` at `firebase/chat.ts:395` is the entry point. It branches on whether the document has a `data` array:

- **New format** (`handleNewBackendFormat`): `data: [{ type, content: [...] }]` array. Backend may emit `TEXT`, `IMAGE`, `PRODUCTS`, `ADD_IMAGES`, `WARNING`/`MINOR` text items, etc. Each item carries its own `content[]` and is collapsed into the unified `MessageI.content` shape.
- **Legacy format**: `content` as object or string. Top-level `type`, `sender`, `status`. `content.displayBody` (when present) replaces `content.body` for UI rendering — used to hide system prompts from the user.

When the new format is fully rolled out, `firestoreDocToMessage` should drop the legacy branch (TODO marker at `firebase/chat.ts:394`).

The `subscribeToMessagesAtPath` snapshot handler keeps a `parsedCache: Map<docId, MessageI>` so unchanged docs reuse the same object reference — keeps Svelte's keyed `{#each}` blocks from re-rendering. It also evicts entries that fall out of the `limitToLast(100)` window even when Firestore doesn't emit a `removed` change.

## Message types and payloads

Constants in `types/message.ts`:

- **`MESSAGE_TYPE`** — `TEXT | LOADING | OPTIMISTIC | STARTER | TILES | CTA | VTON | ADD_IMAGES | PRODUCTS | IMAGE | CONTEXT`. `CONTEXT` = first user-side init message (sent by client to seed metadata, never rendered).
- **`MESSAGE_SENDER`** — `USER | SYSTEM | ASSISTANT`.
- **`MESSAGE_STATUS`** — `PENDING | PROCESSING | COMPLETE | FAILED | TIMEOUT | DRAFT | SUCCESS | SUBMITTED`.
- **`MESSAGE_UI_STATUS`** — `PENDING | RENDERED` (UI-only flag for animation pacing).

Use the type guards (`isTilePayload`, `isProductPayload`, `isVtonPayload`, etc.) before rendering — they're how the chat components dispatch.

## Pending state machinery (chatStore)

Several module-level `$state` slots coordinate cross-mount flows:

- `pendingMessageQueue` — messages submitted before init completes; flushed in send order.
- `pendingStyleMeProduct` — survives unmount during chat migration so the product send replays after the new conversation is live.
- `selfieProductAwaitingReply` / `selfieReplyPendingProduct` / `selfieReplyMessageId` — two-phase deferred product send: (1) selfie image written, wait for AI reply; (2) AI replied, wait for typing animation to finish before posting the product selection.

## Warnings and session ban

Three policy violations end the session for `CHAT_SESSION_RESTORE_TIME` seconds (default 24 h). One `MINOR`-flagged violation ends it immediately.

- `chat_warnings_<conversationId>` — counter, scoped to conversation.
- `chat_session_end_<profileId>_<influencerId>` — JSON `{ reason, restoreAt }`.

`getBanStatus(influencerId)` is checked at init. If banned, the chat subscribes read-only (no new conversation creation). `sendUserMessage` blocks while `sessionEnded === true`.

## Cross-tab try-on queue

`stores/chatTryOnQueue.svelte.ts` syncs a single product (one queue slot) across tabs via the `storage` event. Stale entries (`waiting` or `processing` and older than 5 min) are evicted on init. `markQueueProcessing()` clears the slot once the timer starts so other Style Me buttons re-enable in real time.
