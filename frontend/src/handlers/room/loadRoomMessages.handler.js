import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { syncUnreadFromResponse } from '../../utils/syncUnreadCount.js';

export const loadRoomMessagesHandler = async (
  roomId,
  user,
  setMessages,
  setLoadingMessages,
  setHasMoreMessages,
  setHasMoreNewerMessages,
  messageCache,
  CACHE_TTL,
  unreadCount = 0,
  setUnreadCounts = null
) => {
  const cacheKey = `room_${roomId}`;

  const inMemory = messageCache.current[cacheKey];
  if (inMemory?.messages?.length && Date.now() - inMemory.timestamp < CACHE_TTL) {
    setMessages(inMemory.messages);
    setHasMoreMessages(inMemory.hasMore);
    if (unreadCount > 0) {
      _fetchNewRoomMessages(roomId, cacheKey, inMemory, setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts);
    }
    return;
  }

  const idbData = await dbService.getMessages(cacheKey);
  if (idbData && idbData.messages && idbData.messages.length > 0) {
    setMessages(idbData.messages);
    setHasMoreMessages(idbData.hasMore);
    messageCache.current[cacheKey] = {
      messages: idbData.messages,
      hasMore: idbData.hasMore,
      timestamp: Date.now(),
    };
    setLoadingMessages(false);

    if (unreadCount > 0) {
      _fetchNewRoomMessages(roomId, cacheKey, messageCache.current[cacheKey], setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts);
    }
    return;
  }

  setLoadingMessages(true);
  try {
    const res = await messageService.getRoomMessages(roomId, 20);
    messageCache.current[cacheKey] = {
      messages: res.messages,
      hasMore: res.hasMore,
      timestamp: Date.now(),
    };
    setMessages(res.messages);
    setHasMoreMessages(res.hasMore);
    await dbService.saveMessages(cacheKey, res.messages, res.hasMore);
    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
  } catch (error) {
    console.error('Failed to load room messages:', error);
  } finally {
    setLoadingMessages(false);
  }
};

async function _fetchNewRoomMessages(roomId, cacheKey, currentCache, setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts) {
  try {
    let mergedMessages = currentCache.messages;
    let latestTimestamp = mergedMessages?.[mergedMessages.length - 1]?.timestamp;
    if (!latestTimestamp) return;

    let hasMore = true;
    let lastUnreadCount = unreadCount;

    while (hasMore) {
      const res = await messageService.getRoomMessages(roomId, 20, null, latestTimestamp);
      lastUnreadCount = res.unreadCount;
      hasMore = res.hasMore || false;

      if (!res.messages?.length) break;

      const existingIds = new Set(mergedMessages.map(m => String(m.id)));
      const reallyNew = res.messages.filter(m => !existingIds.has(String(m.id)));

      if (reallyNew.length) {
        mergedMessages = [...mergedMessages, ...reallyNew];
        await dbService.mergeNewMessages(cacheKey, reallyNew);
        latestTimestamp = mergedMessages[mergedMessages.length - 1].timestamp;
      } else if (hasMore) {
        break;
      }
    }

    messageCache.current[cacheKey] = {
      messages: mergedMessages,
      hasMore: currentCache.hasMore,
      timestamp: Date.now(),
    };
    setMessages(mergedMessages);
    if (setHasMoreNewerMessages) setHasMoreNewerMessages(hasMore);
    syncUnreadFromResponse(setUnreadCounts, cacheKey, lastUnreadCount);
  } catch {
  }
}
