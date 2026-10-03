import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';
import { syncUnreadFromResponse } from '../../utils/syncUnreadCount.js';

const fetchNewerMessagesPage = async (
  chatId,
  type,
  messages,
  setMessages,
  messageCache,
  setUnreadCounts,
  roomPrivateKey = null,
  isActive = () => true
) => {
  if (!messages || messages.length === 0) {
    return { messages: messages || [], hasMore: false };
  }

  const latestMessage = [...messages].reverse().find(m => !m.isPending);
  if (!latestMessage) return { messages, hasMore: false };
  const after = latestMessage.timestamp;

  const cacheKey = type === 'room' ? `room_${chatId}` : `private_${chatId}`;

  let res;
  let lastRead = null;

  if (type === 'room') {
    res = await messageService.getRoomMessages(chatId, 20, null, after, roomPrivateKey);
  } else {
    res = await messageService.getPrivateMessages(chatId, 20, null, after);
    lastRead = res.lastRead ?? null;
  }

  if (!res.messages || res.messages.length === 0) {
    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
    return { messages, hasMore: res.hasMore || false };
  }

  const mergeNewer = (current) => {
    const ids = new Set(current.map(m => String(m.id || m._id)));
    const fresh = res.messages.filter(m => !ids.has(String(m.id || m._id)));
    if (!fresh.length) return current;
    const merged = [...current, ...fresh];
    return type === 'private' && lastRead ? applyLastRead(merged, lastRead) : merged;
  };

  let mergedMessages = messages;
  const base = isActive() ? messages : (messageCache.current[cacheKey]?.messages || messages);
  const reallyNew = res.messages.filter(m => !new Set(base.map(x => String(x.id || x._id))).has(String(m.id || m._id)));

  if (reallyNew.length > 0) {
    if (isActive()) {
      setMessages((prev) => (mergedMessages = mergeNewer(prev)));
    } else {
      mergedMessages = mergeNewer(base);
    }

    messageCache.current[cacheKey] = {
      messages: mergedMessages,
      hasMore: messageCache.current[cacheKey]?.hasMore || false,
      timestamp: Date.now(),
    };

    await dbService.mergeNewMessages(cacheKey, reallyNew);
  }

  syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);

  return { messages: mergedMessages, hasMore: res.hasMore || false };
};

export const loadNewerMessagesHandler = async (
  chatId,
  type,
  user,
  messages,
  setMessages,
  setHasMoreNewerMessages,
  messageCache,
  setUnreadCounts = null,
  roomPrivateKey = null,
  isActive = () => true
) => {
  if (!messages || messages.length === 0) return;

  try {
    const { hasMore } = await fetchNewerMessagesPage(chatId, type, messages, setMessages, messageCache, setUnreadCounts, roomPrivateKey, isActive);
    if (isActive()) setHasMoreNewerMessages(hasMore);
  } catch (error) {
    console.error('Failed to load newer messages:', error);
  }
};

export const catchUpNewerMessagesHandler = async (
  chatId,
  type,
  messages,
  setMessages,
  setHasMoreNewerMessages,
  messageCache,
  setUnreadCounts = null,
  roomPrivateKey = null
) => {
  if (!messages || messages.length === 0) return messages;

  let currentMessages = messages;
  let hasMore = true;

  try {
    while (hasMore) {
      const result = await fetchNewerMessagesPage(chatId, type, currentMessages, setMessages, messageCache, setUnreadCounts, roomPrivateKey);
      currentMessages = result.messages;
      hasMore = result.hasMore;
    }
    setHasMoreNewerMessages(false);
  } catch (error) {
    console.error('Failed to catch up on newer messages:', error);
  }

  return currentMessages;
};