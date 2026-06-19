import { paginateMessages } from './MessagePaginationService.js';
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

export async function getRoomMessages({ roomId, limit, before, mapMessage }) {
  const numericLimit = Math.max(1, parseInt(limit, 10) || 20);
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
    mapMessage
  });

  if (cacheKey) {
    messageCache.set(cacheKey, result, PAGE_TTL_SECONDS);
  }

  return result;
}

export async function getPrivateMessages({ userId, otherUserId, limit, before, mapMessage }) {
  const numericLimit = Math.max(1, parseInt(limit, 10) || 20);
  const isFirstPage = !before;
  const cacheKey = isFirstPage ? privateFirstPageKey(userId, otherUserId, numericLimit) : null;

  if (cacheKey) {
    const cached = messageCache.get(cacheKey);
    if (cached) return cached;
  }

  const result = await paginateMessages({
    query: {
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ]
    },
    limit: numericLimit,
    before,
    mapMessage
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

function chatListKey(userId) {
  return `messages:chatlist:${userId}`;
}



export async function getPrivateChats(userId) {
  const cacheKey = chatListKey(userId);
  const cached = messageCache.get(cacheKey);
  if (cached) return cached;

  const chats = await Message.aggregate([
    {
      $match: {
        $or: [{ senderId: userId }, { receiverId: userId }],
        roomId: null
      }
    },
    {
      $group: {
        _id: {
          $cond: {
            if: { $eq: ['$senderId', userId] },
            then: '$receiverId',
            else: '$senderId'
          }
        },
        lastMessage: { $last: '$$ROOT' }
      }
    },
    { $sort: { 'lastMessage.timestamp': -1 } }
  ]);

  messageCache.set(cacheKey, chats, CHAT_LIST_TTL_SECONDS);
  return chats;
}
