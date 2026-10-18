import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';
import { applyNewerMessages, idOf, persistable } from '../../utils/messageList.js';
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
  setUnreadCounts = null,
  setLoadingNewerMessages = null
) => {
  setCurrentPrivateChat(otherUser);
  setCurrentRoom(null);
  setShowMembersModal(false);

  messageService._getPublicKey(otherUser.id).catch(() => {});

  const cacheKey = `private_${otherUser.id}`;

  const inMemory = messageCache.current[cacheKey];
  if (inMemory?.messages?.length && Date.now() - inMemory.timestamp < CACHE_TTL) {
    setMessages(inMemory.messages);
    setHasMoreMessages(inMemory.hasMore);
    setLoadingMessages(false);
    _refreshLastReadStatus(otherUser.id, cacheKey, messageCache, setMessages);
    {
      setLoadingNewerMessages?.(true);
      _fetchNewPrivateMessages(otherUser.id, cacheKey, inMemory, setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts)
        .finally(() => setLoadingNewerMessages?.(false));
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
    {
      setLoadingNewerMessages?.(true);
      _fetchNewPrivateMessages(otherUser.id, cacheKey, messageCache.current[cacheKey], setMessages, setHasMoreMessages, setHasMoreNewerMessages, messageCache, unreadCount, setUnreadCounts)
        .finally(() => setLoadingNewerMessages?.(false));
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
    const lastConfirmed = (list) => [...(list || [])].reverse().find(m => !m.isPending)?.timestamp;
    let latestTimestamp = lastConfirmed(messageCache.current[cacheKey]?.messages ?? currentCache.messages);
    if (!latestTimestamp) return;

    let hasMore = true;
    let lastUnreadCount = unreadCount;

    while (hasMore) {
      const res = await messageService.getPrivateMessages(otherUserId, 20, null, latestTimestamp);
      lastUnreadCount = res.unreadCount;
      hasMore = res.hasMore || false;
      const lastRead = res.lastRead ?? null;
      if (!res.messages?.length) break;

      const known = new Set((messageCache.current[cacheKey]?.messages || []).map(idOf));
      const hadNew = res.messages.some(m => !known.has(idOf(m)));

      const { messages } = applyNewerMessages({
        messageCache, cacheKey, incoming: res.messages, setMessages, fallback: currentCache.messages,
        transform: lastRead ? (m) => applyLastRead(m, lastRead) : undefined,
      });
      await dbService.mergeNewMessages(cacheKey, persistable(res.messages));

      const next = lastConfirmed(messages);
      if (!hadNew || !next || next === latestTimestamp) break;
      latestTimestamp = next;
    }

    if (setHasMoreNewerMessages) setHasMoreNewerMessages(hasMore);
    syncUnreadFromResponse(setUnreadCounts, cacheKey, lastUnreadCount);
  } catch (error) {
    console.error('Failed to fetch new private messages:', error);
  }
}
