import { paginateMessages, fetchMessagesAfter } from './MessagePaginationService.js';
import { messageCache } from './CacheService.js';
import Message from '../models/message.model.js';
import { publish, on as onBroker } from '../broker.js';

const PAGE_TTL_SECONDS = null;
const CHAT_LIST_TTL_SECONDS = null;
const DIRECT_MESSAGE_TTL_SECONDS = null; 
const COMMON_LIMITS = [10, 20, 25, 50];

function _invalidateChatListLocal(userA, userB) {
  messageCache.delete(chatListKey(userA));
  messageCache.delete(chatListKey(userB));
}

onBroker('cache:invalidate:chatlist', ({ userA, userB }) => {
  _invalidateChatListLocal(userA, userB);
});

const inFlight = new Map();

async function dedupe(key, fetcher) {
  const existing = inFlight.get(key);
  if (existing) return existing;

  const promise = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

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

function roomMessageDirectKey(roomId, messageId) {
  return `messages:room:${roomId}:msg:${messageId}`;
}

const MAX_CACHE_LIMIT = Math.max(...COMMON_LIMITS);

function _enrichWithCache(messages, cachedList) {
  if (!cachedList?.length) return messages;
  const cacheById = new Map(cachedList.map((m) => [String(m._id || m.id), m]));
  return messages.map((m) => {
    const c = cacheById.get(String(m._id || m.id));
    if (!c) return m;
    return {
      ...m,
      iv: m.iv || c.iv || null,
      wrappedKey: m.wrappedKey || c.wrappedKey || null,
      senderKeyWrapped: m.senderKeyWrapped || c.senderKeyWrapped || null,
      receiverKeyWrapped: m.receiverKeyWrapped || c.receiverKeyWrapped || null,
    };
  });
}

export async function getRoomMessages({ roomId, userId, limit, before, after, mapMessage }) {
  const numericLimit = Math.max(1, parseInt(limit, 10) || 20);

  if (after) {
    const result = await fetchMessagesAfter({
      query: { roomId },
      limit: numericLimit,
      after,
      mapMessage,
    });
    const cached = messageCache.get(roomFirstPageKey(roomId, MAX_CACHE_LIMIT));
    result.messages = _enrichWithCache(result.messages, cached?.messages);
    return result;
  }

  const isFirstPage = !before;
  const cacheKey = isFirstPage ? roomFirstPageKey(roomId, numericLimit) : null;

  if (cacheKey) {
    return dedupe(cacheKey, async () => {
      const cached = messageCache.get(cacheKey);
      if (cached) return _filterOutSystemMessages(cached, userId);

      const result = await paginateMessages({
        query: { roomId },
        limit: numericLimit,
        before,
        mapMessage,
      });

      messageCache.set(cacheKey, result, PAGE_TTL_SECONDS);
      return _filterOutSystemMessages(result, userId);
    });
  }

  const result = await paginateMessages({
    query: { roomId },
    limit: numericLimit,
    before,
    mapMessage,
  });

  return _filterOutSystemMessages(result, userId);
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
    const result = await fetchMessagesAfter({
      query: privateQuery,
      limit: numericLimit,
      after,
      mapMessage,
    });
    const cached = messageCache.get(privateFirstPageKey(userId, otherUserId, MAX_CACHE_LIMIT));
    result.messages = _enrichWithCache(result.messages, cached?.messages);
    return result;
  }

  const isFirstPage = !before;
  const cacheKey = isFirstPage ? privateFirstPageKey(userId, otherUserId, numericLimit) : null;

  if (cacheKey) {
    return dedupe(cacheKey, async () => {
      const cached = messageCache.get(cacheKey);
      if (cached) return cached;

      const result = await paginateMessages({
        query: privateQuery,
        limit: numericLimit,
        before,
        mapMessage,
      });

      messageCache.set(cacheKey, result, PAGE_TTL_SECONDS);
      return result;
    });
  }

  return paginateMessages({
    query: privateQuery,
    limit: numericLimit,
    before,
    mapMessage,
  });
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
  _invalidateChatListLocal(userA, userB);
  publish('cache:invalidate:chatlist', { userA, userB });
}

export function appendRoomMessages(roomId, messages) {
  for (const msg of messages) {
    const msgId = msg._id || msg.id;
    if (!msgId) continue;
    const direct = {
      id: msgId,
      senderId: msg.senderId,
      roomId,
      username: msg.username,
      text: msg.content ?? msg.text ?? '',
      media: msg.media || null,
      timestamp: msg.timestamp,
    };
    if (msg.iv) direct.iv = msg.iv;
    if (msg.wrappedKey) direct.wrappedKey = msg.wrappedKey;
    messageCache.set(roomMessageDirectKey(roomId, msgId), direct, DIRECT_MESSAGE_TTL_SECONDS);
  }

  for (const limit of COMMON_LIMITS) {
    const key = roomFirstPageKey(roomId, limit);
    const cached = messageCache.get(key);
    if (!cached) continue;

    const existingIds = new Set(cached.messages.map((m) => String(m._id || m.id)));

    const newMapped = messages
      .filter((msg) => !existingIds.has(String(msg._id || msg.id)))
      .map((msg) => {
        const formatted = {
          id: msg._id || msg.id,
          senderId: msg.senderId,
          text: msg.content,
          timestamp: msg.timestamp,
        };
        if (msg.taggedUser) formatted.taggedUser = msg.taggedUser;
        if (msg.replyTo) formatted.replyTo = msg.replyTo;
        if (msg.isSystemMessage) {
          formatted.isSystemMessage = true;
          formatted.systemType = msg.systemType || null;
        }
        if (msg.media) formatted.media = msg.media;
        if (msg.iv) formatted.iv = msg.iv;
        if (msg.wrappedKey) formatted.wrappedKey = msg.wrappedKey;
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
    const direct = {
      id: msgId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      username: msg.username,
      text: msg.content ?? msg.text ?? '',
      media: msg.media || null,
      timestamp: msg.timestamp,
    };
    if (msg.iv) direct.iv = msg.iv;
    if (msg.senderKeyWrapped) direct.senderKeyWrapped = msg.senderKeyWrapped;
    if (msg.receiverKeyWrapped) direct.receiverKeyWrapped = msg.receiverKeyWrapped;
    messageCache.set(
      privateMessageDirectKey(msg.senderId, msg.receiverId, msgId),
      direct,
      DIRECT_MESSAGE_TTL_SECONDS
    );
  }

  for (const limit of COMMON_LIMITS) {
    const key = privateFirstPageKey(senderId, receiverId, limit);
    const cached = messageCache.get(key);
    if (!cached) continue;

    const existingIds = new Set(cached.messages.map((m) => String(m._id || m.id)));

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
        if (msg.taggedUser) formatted.taggedUser = msg.taggedUser;
        if (msg.replyTo) formatted.replyTo = msg.replyTo;
        if (msg.isSystemMessage) {
          formatted.isSystemMessage = true;
          formatted.systemType = msg.systemType || null;
        }
        if (msg.iv) formatted.iv = msg.iv;
        if (msg.wrappedKey) formatted.wrappedKey = msg.wrappedKey;
        if (msg.senderKeyWrapped) formatted.senderKeyWrapped = msg.senderKeyWrapped;
        if (msg.receiverKeyWrapped) formatted.receiverKeyWrapped = msg.receiverKeyWrapped;
        return formatted;
      });

    if (!newMapped.length) continue;

    const updatedMessages = [...cached.messages, ...newMapped].slice(-limit);
    messageCache.set(key, { ...cached, messages: updatedMessages }, PAGE_TTL_SECONDS);
  }

  _invalidateChatListLocal(senderId, receiverId);
  publish('cache:invalidate:chatlist', { userA: senderId, userB: receiverId });
}

export function getPrivateMessageById(senderId, receiverId, messageId) {
  const key = privateMessageDirectKey(senderId, receiverId, messageId);
  const cached = messageCache.get(key);
  if (cached) return cached;

  return null;
}

export function getRoomMessageById(roomId, messageId) {
  const key = roomMessageDirectKey(roomId, messageId);
  const cached = messageCache.get(key);
  if (cached) return cached;

  return null;
}

export function storePrivateMessageDirect(message) {
  const { id, messageId, senderId, receiverId } = message;
  messageCache.set(
    privateMessageDirectKey(senderId, receiverId, id || messageId),
    message,
    DIRECT_MESSAGE_TTL_SECONDS
  );
}

export async function getPrivateChats(userId) {
  const cacheKey = chatListKey(userId);
  const cached = messageCache.get(cacheKey);
  if (cached) return cached;

  return dedupe(cacheKey, async () => {
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
  });
}