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
  roomPrivateKey = null
) => {
  if (!messages || messages.length === 0 || loadingMoreMessages.current) return;
  loadingMoreMessages.current = true;

  try {
    const earliestTimestamp = messages[0].timestamp;
    const res = await messageService.getRoomMessages(roomId, 20, earliestTimestamp, null, roomPrivateKey);

    // The boundary message (or several messages sharing the exact same
    // `earliestTimestamp`) can come back from the server again — dedupe
    // by id so we never render/store the same message twice, matching
    // the guard every other merge path in this app already uses.
    const existingIds = new Set(messages.map(m => String(m.id || m._id)));
    const reallyOlder = (res.messages || []).filter(m => !existingIds.has(String(m.id || m._id)));

    const merged = [...reallyOlder, ...messages];
    setMessages(merged);
    setHasMoreMessages(res.hasMore);

    // Older messages were only ever landing in React state — the
    // in-memory cache and IndexedDB still held the pre-scroll snapshot,
    // so switching chats and back (or a refresh) would silently drop
    // everything just loaded. Persist both, the same way every other
    // message-merge path in this app already does.
    const cacheKey = `room_${roomId}`;
    if (messageCache?.current) {
      messageCache.current[cacheKey] = {
        messages: merged,
        hasMore: res.hasMore,
        timestamp: Date.now(),
      };
    }
    await dbService.saveMessages(cacheKey, merged, res.hasMore);

    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
  } catch (error) {
    console.error('Failed to load more room messages:', error);
  } finally {
    loadingMoreMessages.current = false;
  }
};
