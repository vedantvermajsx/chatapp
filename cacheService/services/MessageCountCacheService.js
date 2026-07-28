
import { messageCache } from './CacheService.js';
import Message from '../models/message.model.js';

const TTL = null;

function roomKey(roomId)             { return `msgCount:room_${roomId}`; }
function privateKey(a, b)            { return `msgCount:private_${[a, b].sort().join(':')}`; }

const MessageCountCacheService = {
  

  async getRoomCount(roomId) {
    const k = roomKey(roomId);
    const cached = messageCache.get(k);
    if (cached !== null) return cached;

    const count = await Message.countDocuments({ roomId });
    messageCache.set(k, count, TTL);
    return count;
  },

  async incrementRoom(roomId, by = 1) {
    const k = roomKey(roomId);
    const cur = messageCache.get(k);
    if (cur !== null) {
      const next = cur + by;
      messageCache.set(k, next, TTL);
      return next;
    }
    // cache cold: warm from DB (DB write happens before this call reaches us),
    // fall back to a count query so we never silently drop the increment.
    const count = await Message.countDocuments({ roomId });
    messageCache.set(k, count, TTL);
    return count;
  },

  invalidateRoom(roomId) {
    messageCache.delete(roomKey(roomId));
  },

  

  async getPrivateCount(senderId, receiverId) {
    const k = privateKey(senderId, receiverId);
    const cached = messageCache.get(k);
    if (cached !== null) return cached;

    const count = await Message.countDocuments({
      roomId: null,
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });
    messageCache.set(k, count, TTL);
    return count;
  },

  incrementPrivate(senderId, receiverId) {
    const k = privateKey(senderId, receiverId);
    const cur = messageCache.get(k);
    if (cur !== null) messageCache.set(k, cur + 1, TTL);
  },

  invalidatePrivate(senderId, receiverId) {
    messageCache.delete(privateKey(senderId, receiverId));
  }
};

export default MessageCountCacheService;
