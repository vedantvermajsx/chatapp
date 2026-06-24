import { paginateMessages, fetchMessagesAfter } from './MessagePaginationService.js';
import { messageCache } from './CacheService.js';
import Message from '../models/message.model.js';

const PAGE_TTL_SECONDS = 60;
const CHAT_LIST_TTL_SECONDS = 60;
const COMMON_LIMITS = [10, 20, 25, 50];

function roomFirstPageKey(roomId, limit) {
  return `messages:room:${roomId}:first:${limit}`;
}

function privateFirstPageKey(userA, userB, limit) {
  const [a, b] = [userA, userB].sort();
  return `messages:private:${a}:${b}:first:${limit}`;
}

function chatListKey(userId) {
  return `messages:chatlist:${userId}`;
}

export async function getRoomMessages({ roomId, limit, before, after, mapMessage }) {
  const numericLimit = Math.max(1, parseInt(limit, 10) || 20);

  if (after) {
    return fetchMessagesAfter({
      query: { roomId },
      limit: numericLimit,
      after,
      mapMessage,
    });
  }

  const isFirstPage = !before;
  const cacheKey = isFirstPage ? roomFirstPageKey(roomId, numericLimit) : null;

  if (cacheKey) {
    const cached = messageCache.get(cacheKey);
    if (cached) return cached;
  }

  const result = await paginateMessages({
    query: { roomId },
    limit: numericLimit,
    before,
    mapMessage,
  });

  if (cacheKey) {
    messageCache.set(cacheKey, result, PAGE_TTL_SECONDS);
  }

  return result;
}

export async function getPrivateMessages({ userId, otherUserId, limit, before, after, mapMessage }) {
  const numericLimit = Math.max(1, parseInt(limit, 10) || 20);

  const privateQuery = {
    $or: [
      { senderId: userId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: userId },
    ],
    deletedFor: { $ne: userId },
  };

  if (after) {
    return fetchMessagesAfter({
      query: privateQuery,
      limit: numericLimit,
      after,
      mapMessage,
    });
  }

  const isFirstPage = !before;
  const cacheKey = isFirstPage ? privateFirstPageKey(userId, otherUserId, numericLimit) : null;

  if (cacheKey) {
    const cached = messageCache.get(cacheKey);
    if (cached) return cached;
  }

  const result = await paginateMessages({
    query: privateQuery,
    limit: numericLimit,
    before,
    mapMessage,
  });

  if (cacheKey) {
    messageCache.set(cacheKey, result, PAGE_TTL_SECONDS);
  }

  return result;
}

export function invalidateRoomMessages(roomId) {
  for (const limit of COMMON_LIMITS) {
    messageCache.delete(roomFirstPageKey(roomId, limit));
  }
}

export function invalidatePrivateMessages(userA, userB) {
  for (const limit of COMMON_LIMITS) {
    messageCache.delete(privateFirstPageKey(userA, userB, limit));
  }
  messageCache.delete(chatListKey(userA));
  messageCache.delete(chatListKey(userB));
}

export function appendRoomMessages(roomId, messages) {
  for (const limit of COMMON_LIMITS) {
    const key = roomFirstPageKey(roomId, limit);
    const cached = messageCache.get(key);
    if (cached) {
      const newCachedMessages = messages.map((msg) => {
        const formatted = {
          id: msg._id || msg.uuid,
          text: msg.content,
          isSystemMessage: msg.isSystemMessage,
          systemType: msg.systemType,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
        };
        if (msg.media) formatted.media = msg.media;
        return formatted;
      });
      newCachedMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const updatedMessages = [...newCachedMessages, ...cached.messages];
      messageCache.set(key, { ...cached, messages: updatedMessages.slice(0, limit) }, PAGE_TTL_SECONDS);
    }
  }
}

export function appendPrivateMessages(senderId, receiverId, messages) {
  for (const limit of COMMON_LIMITS) {
    const key = privateFirstPageKey(senderId, receiverId, limit);
    const cached = messageCache.get(key);
    if (cached) {
      const newCachedMessages = messages.map((msg) => ({
        id: msg._id || msg.uuid,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        text: msg.content,
        isSystemMessage: msg.isSystemMessage,
        systemType: msg.systemType,
        timestamp: msg.timestamp,
        media: msg.media || null,
      }));
      newCachedMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const updatedMessages = [...newCachedMessages, ...cached.messages];
      messageCache.set(key, { ...cached, messages: updatedMessages.slice(0, limit) }, PAGE_TTL_SECONDS);
    }
  }
  messageCache.delete(chatListKey(senderId));
  messageCache.delete(chatListKey(receiverId));
}

export async function getPrivateChats(userId) {
  const cacheKey = chatListKey(userId);
  const cached = messageCache.get(cacheKey);
  if (cached) return cached;

  const chats = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
        roomId: null,
        $nor: [{ deletedFor: userId }],
      },
    },
    { $sort: { timestamp: 1 } },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$senderId', userId] },
            then: '$receiverId',
            else: '$senderId',
          },
        },
        lastMessage: { $last: '$$ROOT' },
      },
    },
    { $sort: { 'lastMessage.timestamp': -1 } },
  ]);

  messageCache.set(cacheKey, chats, CHAT_LIST_TTL_SECONDS);
  return chats;
}
