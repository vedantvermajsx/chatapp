import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { mergeOlder, MAX_MESSAGES } from '../../utils/messageList.js';
import { syncUnreadFromResponse } from '../../utils/syncUnreadCount.js';

export const loadMoreRoomMessagesHandler = async (
  roomId,
  messages,
  setMessages,
  setHasMoreMessages,
  loadingMoreMessages,
  messageCache,
  setUnreadCounts = null,
  roomPrivateKey = null,
  isActive = () => true
) => {
  if (!messages || messages.length === 0 || loadingMoreMessages.current) return;
  if (messages.length >= MAX_MESSAGES) return;
  loadingMoreMessages.current = true;

  try {
    const anchor = messages.find(m => !m.isPending);
    if (!anchor) return;
    const res = await messageService.getRoomMessages(roomId, 20, anchor.timestamp, null, roomPrivateKey);

    const cacheKey = `room_${roomId}`;
    const incoming = res.messages || [];
    const entry = messageCache?.current?.[cacheKey];
    const { messages: merged, dropped } = mergeOlder(entry?.messages ?? messages, incoming);
    const hasMore = !!res.hasMore || dropped > 0;

    if (messageCache?.current) {
      messageCache.current[cacheKey] = { messages: merged, hasMore, timestamp: Date.now() };
    }
    if (isActive()) {
      setMessages((prev) => mergeOlder(prev, incoming).messages);
      setHasMoreMessages(hasMore);
    }
    await dbService.mergeOlderMessages(cacheKey, incoming, hasMore);

    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
  } catch (error) {
    console.error('Failed to load more room messages:', error);
  } finally {
    loadingMoreMessages.current = false;
  }
};
