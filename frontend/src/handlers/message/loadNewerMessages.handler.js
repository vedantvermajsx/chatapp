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
  setUnreadCounts
) => {
  if (!messages || messages.length === 0) {
    return { messages: messages || [], hasMore: false };
  }

  const latestMessage = messages[messages.length - 1];
  const after = latestMessage.timestamp;

  const cacheKey = type === 'room' ? `room_${chatId}` : `private_${chatId}`;

  let res;
  let lastRead = null;

  if (type === 'room') {
    res = await messageService.getRoomMessages(chatId, 20, null, after);
  } else {
    res = await messageService.getPrivateMessages(chatId, 20, null, after);
    lastRead = res.lastRead ?? null;
  }

  if (!res.messages || res.messages.length === 0) {
    syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);
    return { messages, hasMore: res.hasMore || false };
  }

  const existingIds = new Set(messages.map(m => String(m.id || m._id)));
  const reallyNew = res.messages.filter(m => !existingIds.has(String(m.id || m._id)));

  let mergedMessages = messages;

  if (reallyNew.length > 0) {
    mergedMessages = [...messages, ...reallyNew];

    if (type === 'private' && lastRead) {
      mergedMessages = applyLastRead(mergedMessages, lastRead);
    }

    messageCache.current[cacheKey] = {
      messages: mergedMessages,
      hasMore: messageCache.current[cacheKey]?.hasMore || false,
      timestamp: Date.now(),
    };

    setMessages(mergedMessages);
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
  setUnreadCounts = null
) => {
  if (!messages || messages.length === 0) return;

  try {
    const { hasMore } = await fetchNewerMessagesPage(chatId, type, messages, setMessages, messageCache, setUnreadCounts);
    setHasMoreNewerMessages(hasMore);
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
  setUnreadCounts = null
) => {
  if (!messages || messages.length === 0) return messages;

  let currentMessages = messages;
  let hasMore = true;

  try {
    while (hasMore) {
      const result = await fetchNewerMessagesPage(chatId, type, currentMessages, setMessages, messageCache, setUnreadCounts);
      currentMessages = result.messages;
      hasMore = result.hasMore;
    }
    setHasMoreNewerMessages(false);
  } catch (error) {
    console.error('Failed to catch up on newer messages:', error);
  }

  return currentMessages;
};