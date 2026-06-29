import { paginateMessages, fetchMessagesAfter } from './MessagePaginationService.js';
import { messageCache } from './CacheService.js';
import Message from '../models/message.model.js';

const PAGE_TTL_SECONDS = 60;
const CHAT_LIST_TTL_SECONDS = 60;
const DIRECT_MESSAGE_TTL_SECONDS = 60 * 60 * 24; 
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

function privateMessageDirectKey(senderId, receiverId, messageId) {
  return `messages:private:${senderId}:${receiverId}:msg:${messageId}`;
}

export async function getRoomMessages({ roomId, userId, limit, before, after, mapMessage }) {
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

  console.log(result);

  if (cacheKey) {
    messageCache.set(cacheKey, result, PAGE_TTL_SECONDS);
  }

  const filteredData = _filterOutSystemMessages(result, userId);

  return filteredData;
}

function _filterOutSystemMessages(result, userId) {
  return {
    ...result,
    messages: result.messages.filter(
      (msg) =>
        !(
          msg.senderId === userId &&
          msg.isSystemMessage &&
          ['member-joined', 'member-left'].includes(msg.systemType)
        )
    ),
  };
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
    if (!cached) continue;

    const existingIds = new Set(cached.messages.map((m) => String(m.id)));

    const newMapped = messages
      .filter((msg) => !existingIds.has(String(msg._id || msg.id)))
      .map((msg) => {
        const formatted = {
          id: msg._id || msg.id,
          senderId: msg.senderId,
          text: msg.content,
          timestamp: msg.timestamp,
        };
        if (msg.isSystemMessage) {
          formatted.isSystemMessage = true;
          formatted.systemType = msg.systemType || null;
        }
        if (msg.media) formatted.media = msg.media;
        return formatted;
      });

    if (!newMapped.length) continue;

    const updatedMessages = [...cached.messages, ...newMapped].slice(-limit);
    messageCache.set(key, { ...cached, messages: updatedMessages }, PAGE_TTL_SECONDS);
  }
}

export function appendPrivateMessages(senderId, receiverId, messages) {
  const msg = messages[0];
  if (msg) {
    const msgId = msg._id || msg.id;
    messageCache.set(
      privateMessageDirectKey(msg.senderId, msg.receiverId, msgId),
      { id: msgId, senderId: msg.senderId, receiverId: msg.receiverId, timestamp: msg.timestamp },
      DIRECT_MESSAGE_TTL_SECONDS
    );
  }

  for (const limit of COMMON_LIMITS) {
    const key = privateFirstPageKey(senderId, receiverId, limit);
    const cached = messageCache.get(key);
    if (!cached) continue;

    const existingIds = new Set(cached.messages.map((m) => String(m.id)));

    const newMapped = messages
      .filter((msg) => !existingIds.has(String(msg._id || msg.id)))
      .map((msg) => {
        const formatted = {
          id: msg._id  || msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          text: msg.content,
          timestamp: msg.timestamp,
          media: msg.media || null,
        };
        if (msg.isSystemMessage) {
          formatted.isSystemMessage = true;
          formatted.systemType = msg.systemType || null;
        }
        return formatted;
      });

    if (!newMapped.length) continue;

    const updatedMessages = [...cached.messages, ...newMapped].slice(-limit);
    messageCache.set(key, { ...cached, messages: updatedMessages }, PAGE_TTL_SECONDS);
  }

  messageCache.delete(chatListKey(senderId));
  messageCache.delete(chatListKey(receiverId));
}

export function getPrivateMessageById(senderId, receiverId, messageId) {
  const key = privateMessageDirectKey(senderId, receiverId, messageId);
  const cached = messageCache.get(key);
  if (cached) return cached;

  return null;
}

export function storePrivateMessageDirect({ senderId, receiverId, messageId, timestamp }) {
  messageCache.set(
    privateMessageDirectKey(senderId, receiverId, messageId),
    { id: messageId, senderId, receiverId, timestamp },
    DIRECT_MESSAGE_TTL_SECONDS
  );
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