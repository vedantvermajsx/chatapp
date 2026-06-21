import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';

export const loadRoomMessagesHandler = async (
  roomId,
  user,
  setMessages,
  setLoadingMessages,
  setHasMoreMessages,
  messageCache,
  CACHE_TTL
) => {
  const cacheKey = `room_${roomId}`;

  const inMemory = messageCache.current[cacheKey];
  if (inMemory?.messages?.length && Date.now() - inMemory.timestamp < CACHE_TTL) {
    setMessages(inMemory.messages);
    setHasMoreMessages(inMemory.hasMore);
    _fetchNewRoomMessages(roomId, cacheKey, inMemory, setMessages, setHasMoreMessages, messageCache);
    return;
  }

  const idbData = await dbService.getMessages(cacheKey);
  if (idbData.messages.length > 0) {
    setMessages(idbData.messages);
    setHasMoreMessages(idbData.hasMore);
    messageCache.current[cacheKey] = {
      messages: idbData.messages,
      hasMore: idbData.hasMore,
      timestamp: Date.now(),
    };
    setLoadingMessages(false);

    _fetchNewRoomMessages(roomId, cacheKey, messageCache.current[cacheKey], setMessages, setHasMoreMessages, messageCache);
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
  } catch (error) {
    console.error('Failed to load room messages:', error);
  } finally {
    setLoadingMessages(false);
  }
};

async function _fetchNewRoomMessages(roomId, cacheKey, currentCache, setMessages, setHasMoreMessages, messageCache) {
  try {
    const latestTimestamp = currentCache.messages?.[currentCache.messages.length - 1]?.timestamp;
    if (!latestTimestamp) return;

    const res = await messageService.getRoomMessages(roomId, 20, null, latestTimestamp);
    if (!res.messages?.length) return; 

    const existingIds = new Set(currentCache.messages.map(m => String(m.id)));
    const reallyNew = res.messages.filter(m => !existingIds.has(String(m.id)));
    if (!reallyNew.length) return;

    const merged = [...currentCache.messages, ...reallyNew];
    messageCache.current[cacheKey] = {
      messages: merged,
      hasMore: currentCache.hasMore,
      timestamp: Date.now(),
    };
    setMessages(merged);
    await dbService.mergeNewMessages(cacheKey, reallyNew);
  } catch {
  }
}
