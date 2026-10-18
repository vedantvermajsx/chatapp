import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';
import { applyNewerMessages, idOf, persistable } from '../../utils/messageList.js';
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

  const known = new Set((messageCache.current[cacheKey]?.messages || messages).map(idOf));
  const hadNew = res.messages.some(m => !known.has(idOf(m)));

  const { messages: mergedMessages } = applyNewerMessages({
    messageCache, cacheKey, incoming: res.messages, setMessages, isActive, fallback: messages,
    transform: type === 'private' && lastRead ? (m) => applyLastRead(m, lastRead) : undefined,
  });
  await dbService.mergeNewMessages(cacheKey, persistable(res.messages));

  syncUnreadFromResponse(setUnreadCounts, cacheKey, res.unreadCount);

  return { messages: mergedMessages, hasMore: hadNew ? (res.hasMore || false) : false };
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