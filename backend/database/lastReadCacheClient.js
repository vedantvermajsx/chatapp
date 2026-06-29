import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

class LastReadCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_SERVICE_SECRET },
      timeout: 2000
    });
  }

  
  async get(userId, chatKey) {
    try {
      const res = await this.client.get(`/last-read/${userId}/${chatKey}`);
      return res.data.cold ? null : res.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      console.error('[LastReadCacheClient] get error:', err.message);
      return null;
    }
  }

  async setRoom(userId, roomId, { messageId, lastReadAt }) {
    try {
      await this.client.post(`/last-read/${userId}/room`, { roomId, messageId, lastReadAt });
    } catch (err) {
      console.error('[LastReadCacheClient] setRoom error:', err.message);
    }
  }

  async setPrivate(userId, peerId, { messageId, timestamp, lastSeenAt }) {
    try {
      await this.client.post(`/last-read/${userId}/private`, { peerId, messageId, timestamp, lastSeenAt });
    } catch (err) {
      console.error('[LastReadCacheClient] setPrivate error:', err.message);
    }
  }

  async invalidate(userId, chatKey) {
    try {
      await this.client.delete(`/last-read/${userId}/${chatKey}`);
    } catch (err) {
      console.error('[LastReadCacheClient] invalidate error:', err.message);
    }
  }
}

export default new LastReadCacheClient();
