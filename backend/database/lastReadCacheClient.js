import axios from 'axios';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';
dotenv.config();

class LastReadCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
    attachHmacInterceptor(this.client);
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
      await this.client.post(`/last-read/${userId}/room`, { roomId, messageId, lastReadAt }, { timeout: 30000 });
    } catch (err) {
      console.error('[LastReadCacheClient] setRoom error:', err.message);
    }
  }

  async setPrivate(userId, peerId, { messageId, timestamp, lastSeenAt }) {
    try {
      await this.client.post(`/last-read/${userId}/private`, { peerId, messageId, timestamp, lastSeenAt }, { timeout: 30000 });
    } catch (err) {
      console.error('[LastReadCacheClient] setPrivate error:', err.message);
    }
  }

  async invalidate(userId, chatKey) {
    try {
      await this.client.delete(`/last-read/${userId}/${chatKey}`, { timeout: 30000 });
    } catch (err) {
      console.error('[LastReadCacheClient] invalidate error:', err.message);
    }
  }
}

export default new LastReadCacheClient();
