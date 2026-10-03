import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
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
  loadingMoreMessages.current = true;

  try {
    const anchor = messages.find(m => !m.isPending);
    if (!anchor) return;
    const earliestTimestamp = anchor.timestamp;
    const res = await messageService.getRoomMessages(roomId, 20, earliestTimestamp, null, roomPrivateKey);

    const cacheKey = `room_${roomId}`;
    const incoming = res.messages || [];
    let merged = messages;

    const mergeOlder = (current) => {
      const ids = new Set(current.map(m => String(m.id || m._id)));
      const older = incoming.filter(m => !ids.has(String(m.id || m._id)));
      return older.length ? [...older, ...current] : current;
    };

    if (isActive()) {
      setMessages((prev) => (merged = mergeOlder(prev)));
      setHasMoreMessages(res.hasMore);
    } else {
      merged = mergeOlder(messageCache?.current?.[cacheKey]?.messages || messages);
    }

    if (messageCache?.current) {
      messageCache.current[cacheKey] = { messages: merged, hasMore: res.hasMore, timestamp: Date.now() };
    }
    await dbService.saveMessages(cacheKey, merged, res.hasMore);

    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
  } catch (error) {
    console.error('Failed to load more room messages:', error);
  } finally {
    loadingMoreMessages.current = false;
  }
};
