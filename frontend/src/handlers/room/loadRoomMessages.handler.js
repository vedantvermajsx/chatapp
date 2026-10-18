import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyNewerMessages, idOf, persistable } from '../../utils/messageList.js';
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
  setUnreadCounts = null,
  roomPrivateKey = null,
  setLoadingNewerMessages = null
) => {
  const cacheKey = `room_${roomId}`;

  const inMemory = messageCache.current[cacheKey];
  if (inMemory?.messages?.length && Date.now() - inMemory.timestamp < CACHE_TTL) {
    setMessages(inMemory.messages);
    setHasMoreMessages(inMemory.hasMore);
    {
      setLoadingNewerMessages?.(true);
      _fetchNewRoomMessages(roomId, cacheKey, inMemory, setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts, roomPrivateKey)
        .finally(() => setLoadingNewerMessages?.(false));
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

    {
      setLoadingNewerMessages?.(true);
      _fetchNewRoomMessages(roomId, cacheKey, messageCache.current[cacheKey], setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts, roomPrivateKey)
        .finally(() => setLoadingNewerMessages?.(false));
    }
    return;
  }

  setLoadingMessages(true);
  try {
    const res = await messageService.getRoomMessages(roomId, 20, null, null, roomPrivateKey);
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

async function _fetchNewRoomMessages(roomId, cacheKey, currentCache, setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts, roomPrivateKey = null) {
  // setMessages / setHasMoreNewerMessages are guarded by the caller's switch id, so a room switch can't clobber state.
  try {
    const lastConfirmed = (list) => [...(list || [])].reverse().find(m => !m.isPending)?.timestamp;
    let latestTimestamp = lastConfirmed(messageCache.current[cacheKey]?.messages ?? currentCache.messages);
    if (!latestTimestamp) return;

    let hasMore = true;
    let lastUnreadCount = unreadCount;

    while (hasMore) {
      const res = await messageService.getRoomMessages(roomId, 20, null, latestTimestamp, roomPrivateKey);
      lastUnreadCount = res.unreadCount;
      hasMore = res.hasMore || false;
      if (!res.messages?.length) break;

      const known = new Set((messageCache.current[cacheKey]?.messages || []).map(idOf));
      const hadNew = res.messages.some(m => !known.has(idOf(m)));

      const { messages } = applyNewerMessages({
        messageCache, cacheKey, incoming: res.messages, setMessages, fallback: currentCache.messages,
      });
      await dbService.mergeNewMessages(cacheKey, persistable(res.messages));

      const next = lastConfirmed(messages);
      if (!hadNew || !next || next === latestTimestamp) break;
      latestTimestamp = next;
    }

    if (setHasMoreNewerMessages) setHasMoreNewerMessages(hasMore);
    syncUnreadFromResponse(setUnreadCounts, cacheKey, lastUnreadCount);
  } catch (error) {
    console.error('Failed to fetch new room messages:', error);
  }
}
