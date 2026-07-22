import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';
import { syncUnreadFromResponse } from '../../utils/syncUnreadCount.js';

export const startPrivateChatHandler = async (
  otherUser,
  user,
  setCurrentPrivateChat,
  setCurrentRoom,
  setShowMembersModal,
  setMessages,
  setLoadingMessages,
  setHasMoreMessages,
  setHasMoreNewerMessages,
  messageCache,
  CACHE_TTL,
  unreadCount = 0,
  setUnreadCounts = null
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
    _refreshLastReadStatus(otherUser.id, cacheKey, messageCache, setMessages);
    if (unreadCount > 0) {
      _fetchNewPrivateMessages(otherUser.id, cacheKey, inMemory, setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts);
    }
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
    _refreshLastReadStatus(otherUser.id, cacheKey, messageCache, setMessages);
    if (unreadCount > 0) {
      _fetchNewPrivateMessages(otherUser.id, cacheKey, messageCache.current[cacheKey], setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts);
    }
    return;
  }

  setMessages([]);
  setLoadingMessages(true);
  try {
    const res = await messageService.getPrivateMessages(otherUser.id, 20);
    const messagesWithRead = applyLastRead(res.messages, res.lastRead);
    messageCache.current[cacheKey] = {
      messages: messagesWithRead,
      hasMore: res.hasMore,
      timestamp: Date.now(),
    };
    setMessages(messagesWithRead);
    setHasMoreMessages(res.hasMore);
    await dbService.saveMessages(cacheKey, messagesWithRead, res.hasMore);
    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
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

async function _refreshLastReadStatus(otherUserId, cacheKey, messageCache, setMessages) {
  try {
    const { lastRead } = await messageService.getLastReadStatus(otherUserId);
    const currentCache = messageCache.current[cacheKey];
    if (!currentCache?.messages?.length) return;

    const refreshed = applyLastRead(currentCache.messages, lastRead);
    if (refreshed === currentCache.messages) return;

    messageCache.current[cacheKey] = { ...currentCache, messages: refreshed };
    setMessages(refreshed);
    await dbService.saveMessages(cacheKey, refreshed, currentCache.hasMore);
  } catch {
  }
}

async function _fetchNewPrivateMessages(otherUserId, cacheKey, currentCache, setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts) {
  try {
    let mergedMessages = currentCache.messages;
    let latestTimestamp = mergedMessages?.[mergedMessages.length - 1]?.timestamp;
    if (!latestTimestamp) return;

    let hasMore = true;
    let lastRead = null;
    let lastUnreadCount = unreadCount;

    while (hasMore) {
      const res = await messageService.getPrivateMessages(otherUserId, 20, null, latestTimestamp);
      lastRead = res.lastRead ?? lastRead;
      lastUnreadCount = res.unreadCount;

      const existingIds = new Set(mergedMessages.map(m => String(m.id)));
      const reallyNew = (res.messages || []).filter(m => !existingIds.has(String(m.id)));

      if (reallyNew.length) {
        mergedMessages = [...mergedMessages, ...reallyNew];
        await dbService.mergeNewMessages(cacheKey, reallyNew);
        latestTimestamp = mergedMessages[mergedMessages.length - 1].timestamp;
      }

      hasMore = res.hasMore || false;
      if (!reallyNew.length && hasMore) break;
    }

    if (lastRead) {
      mergedMessages = applyLastRead(mergedMessages, lastRead);
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
