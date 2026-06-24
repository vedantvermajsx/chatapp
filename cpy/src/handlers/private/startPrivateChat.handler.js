import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';

export const startPrivateChatHandler = async (
  otherUser,
  user,
  setCurrentPrivateChat,
  setCurrentRoom,
  setShowMembersModal,
  setMessages,
  setLoadingMessages,
  setHasMoreMessages,
  messageCache,
  CACHE_TTL
) => {
  setCurrentPrivateChat(otherUser);
  setCurrentRoom(null);
  setShowMembersModal(false);

  const cacheKey = `private_${otherUser.id}`;

  const inMemory = messageCache.current[cacheKey];
  if (inMemory?.messages?.length && Date.now() - inMemory.timestamp < CACHE_TTL) {
    setMessages(inMemory.messages);
    setHasMoreMessages(inMemory.hasMore);
    setLoadingMessages(false);
    _fetchNewPrivateMessages(otherUser.id, cacheKey, inMemory, setMessages, setHasMoreMessages, messageCache);
    return;
  }

  const idbData = await dbService.getMessages(cacheKey);
  if (idbData.messages.length > 0) {
    setMessages(idbData.messages);
    setHasMoreMessages(idbData.hasMore);
    setLoadingMessages(false);
    messageCache.current[cacheKey] = {
      messages: idbData.messages,
      hasMore: idbData.hasMore,
      timestamp: Date.now(),
    };
    _fetchNewPrivateMessages(otherUser.id, cacheKey, messageCache.current[cacheKey], setMessages, setHasMoreMessages, messageCache);
    return;
  }

  setMessages([]);
  setLoadingMessages(true);
  try {
    const res = await messageService.getPrivateMessages(otherUser.id, 20);
    messageCache.current[cacheKey] = {
      messages: res.messages,
      hasMore: res.hasMore,
      timestamp: Date.now(),
    };
    setMessages(res.messages);
    setHasMoreMessages(res.hasMore);
    await dbService.saveMessages(cacheKey, res.messages, res.hasMore);
  } catch (error) {
    const idbFallback = await dbService.getMessages(cacheKey);
    if (idbFallback.messages.length > 0) {
      setMessages(idbFallback.messages);
      setHasMoreMessages(idbFallback.hasMore);
    }
    console.error('Failed to load private messages:', error);
  } finally {
    setLoadingMessages(false);
  }
};

async function _fetchNewPrivateMessages(otherUserId, cacheKey, currentCache, setMessages, setHasMoreMessages, messageCache) {
  try {
    const latestTimestamp = currentCache.messages?.[currentCache.messages.length - 1]?.timestamp;
    if (!latestTimestamp) return;

    const res = await messageService.getPrivateMessages(otherUserId, 20, null, latestTimestamp);
    if (!res.messages?.length) return;

    const existingIds = new Set(currentCache.messages.map(m => String(m.id)));
    const reallyNew = res.messages.filter(m => !existingIds.has(String(m.id)));
    if (!reallyNew.length) return;

    const merged = [...currentCache.messages, ...reallyNew]
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
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
