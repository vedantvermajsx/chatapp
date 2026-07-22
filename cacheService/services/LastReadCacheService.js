import { readStateCache } from './CacheService.js';
import ConversationRead from '../models/conversationRead.model.js';
import RoomMessageRead from '../models/roomMessageRead.model.js';

const TTL = null; 
const EMPTY = Symbol('lastRead:empty');
const NEGATIVE_TTL = null; 

function key(userId, chatKey) {
  return `lastRead:${userId}:${chatKey}`;
}

const inFlight = new Map();

async function dedupe(k, fetcher) {
  const existing = inFlight.get(k);
  if (existing) return existing;

  const promise = fetcher().finally(() => inFlight.delete(k));
  inFlight.set(k, promise);
  return promise;
}

const LastReadCacheService = {
  get(userId, chatKey) {
    const cached = readStateCache.get(key(userId, chatKey));
    return cached === EMPTY ? null : cached;
  },

  async getOrLoad(userId, chatKey) {
    const k = key(userId, chatKey);
    const cached = readStateCache.get(k);
    if (cached !== null) return cached === EMPTY ? null : cached;

    return dedupe(k, async () => {
      let record = null;

      if (chatKey.startsWith('room_')) {
        const roomId = chatKey.slice(5);
        record = await RoomMessageRead.findOne({ userId, roomId })
          .select('lastReadMessageId lastReadAt')
          .lean();
        if (record) {
          const val = { messageId: record.lastReadMessageId, lastReadAt: record.lastReadAt };
          readStateCache.set(k, val, TTL);
          return val;
        }
      } else if (chatKey.startsWith('private_')) {
        const senderId = chatKey.slice(8);
        record = await ConversationRead.findOne({ senderId, receiverId: userId })
          .select('messageId timestamp lastSeenAt')
          .lean();
        if (record) {
          const val = {
            messageId: record.messageId,
            timestamp: record.timestamp,
            lastSeenAt: record.lastSeenAt,
          };
          readStateCache.set(k, val, TTL);
          return val;
        }
      }

      readStateCache.set(k, EMPTY, NEGATIVE_TTL);
      return null;
    });
  },

  setRoom(userId, roomId, { messageId, lastReadAt }) {
    readStateCache.set(key(userId, `room_${roomId}`), { messageId, lastReadAt }, TTL);
  },

  setPrivate(userId, peerId, { messageId, timestamp, lastSeenAt }) {
    if(!userId || !peerId || !messageId){
      return;
    }
    readStateCache.set(key(userId, `private_${peerId}`), { messageId, timestamp, lastSeenAt }, TTL);
  },

  invalidate(userId, chatKey) {
    readStateCache.delete(key(userId, chatKey));
  },

  invalidateAllForUser(userId, chatKeys = []) {
    for (const ck of chatKeys) {
      readStateCache.delete(key(userId, ck));
    }
  }
};

export default LastReadCacheService;
