import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

class UnreadCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 2000, // fast — never block the message flow
    });
  }

  /** Get all unread counts for a user. Returns { cold, counts } */
  async getAll(userId) {
    try {
      const res = await this.client.get(`/unread/${userId}`);
      return res.data; // { cold: false, counts: { room_x: N, ... } }
    } catch (err) {
      if (err.response?.status === 404) return { cold: true, counts: {} };
      console.error('[UnreadCacheClient] getAll error:', err.message);
      return { cold: true, counts: {} };
    }
  }

  /** Increment unread for a single user + chatKey */
  async increment(userId, chatKey) {
    try {
      await this.client.post(`/unread/${userId}/increment`, { chatKey });
    } catch (err) {
      console.error('[UnreadCacheClient] increment error:', err.message);
    }
  }

  /**
   * Bulk-increment for a room message.
   * memberIds: all groupMembers
   * senderId:  excluded from increment
   * activeViewers: Set/Array of userIds currently viewing this room (also excluded)
   * chatKey: "room_{roomId}"
   */
  async incrementForRoom(memberIds, senderId, activeViewerIds, chatKey) {
    try {
      const skip = new Set([String(senderId), ...activeViewerIds.map(String)]);
      const targets = memberIds.map(String).filter(id => !skip.has(id));
      if (targets.length === 0) return;
      await this.client.post(`/unread/members/increment`, {
        memberIds: targets,
        senderId,
        chatKey,
      });
    } catch (err) {
      console.error('[UnreadCacheClient] incrementForRoom error:', err.message);
    }
  }

  /** Increment unread for private message receiver */
  async incrementPrivate(receiverId, senderId) {
    try {
      await this.client.post(`/unread/${receiverId}/increment`, {
        chatKey: `private_${senderId}`,
      });
    } catch (err) {
      console.error('[UnreadCacheClient] incrementPrivate error:', err.message);
    }
  }

  /** Reset unread count for userId + chatKey to 0 */
  async reset(userId, chatKey) {
    try {
      await this.client.post(`/unread/${userId}/reset`, { chatKey });
    } catch (err) {
      console.error('[UnreadCacheClient] reset error:', err.message);
    }
  }

  /** Seed cache from a pre-computed counts object (used on cold start) */
  async seed(userId, counts) {
    try {
      await this.client.post(`/unread/${userId}/seed`, { counts });
    } catch (err) {
      console.error('[UnreadCacheClient] seed error:', err.message);
    }
  }

  /** Invalidate cache for a user (force re-seed on next read) */
  async invalidate(userId) {
    try {
      await this.client.delete(`/unread/${userId}`);
    } catch (err) {
      console.error('[UnreadCacheClient] invalidate error:', err.message);
    }
  }
}

export default new UnreadCacheClient();
