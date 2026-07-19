import axios from 'axios';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';
dotenv.config();

class UnreadCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 1000 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 1000 }),
    });
    attachHmacInterceptor(this.client);
    this.resetBatch = new Map();
    this.batchTimer = null;
  }

  async getAll(userId) {
    try {
      const res = await this.client.get(`/unread/${userId}`);
      return res.data; 
    } catch (err) {
      if (err.response?.status === 404) return { cold: true, counts: {} };
      console.error('[UnreadCacheClient] getAll error:', err.message);
      return { cold: true, counts: {} };
    }
  }

  async increment(userId, chatKey) {
    try {
      await this.client.post(`/unread/${userId}/increment`, { chatKey }, { timeout: 30000 });
    } catch (err) {
      console.error('[UnreadCacheClient] increment error:', err.message);
    }
  }

  async seedRoomOnJoin(userId, roomId) {
    try {
      await this.client.post(`/unread/${userId}/room/${roomId}/join-seed`, undefined, { timeout: 30000 });
    } catch (err) {
      console.error('[UnreadCacheClient] seedRoomOnJoin error:', err.message);
    }
  }

  async incrementPrivate(receiverId, senderId) {
    try {
      await this.client.post(`/unread/${receiverId}/increment`, {
        chatKey: `private_${senderId}`,
      }, { timeout: 30000 });
    } catch (err) {
      console.error('[UnreadCacheClient] incrementPrivate error:', err.message);
    }
  }

  async reset(userId, chatKey) {
    try {
      const res = await this.client.post(`/unread/${userId}/reset`, { chatKey }, { timeout: 30000 });
      return res.data?.count ?? 0;
    } catch (err) {
      console.error('[UnreadCacheClient] reset error:', err.message);
      return null;
    }
  }

  async resetMultiple(userIds, chatKey) {
    if (!this.resetBatch.has(chatKey)) {
      this.resetBatch.set(chatKey, new Set());
    }
    const set = this.resetBatch.get(chatKey);
    for (const id of userIds) set.add(id);

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this._flushResetBatch(), 200);
    }
  }

  async _flushResetBatch() {
    this.batchTimer = null;
    const batches = this.resetBatch;
    this.resetBatch = new Map();

    for (const [chatKey, userSet] of batches.entries()) {
      try {
        await this.client.post(`/unread/reset-multiple`, { userIds: Array.from(userSet), chatKey }, { timeout: 30000 });
      } catch (err) {
        console.error('[UnreadCacheClient] resetMultiple error:', err.message);
      }
    }
  }

  async decrement(userId, chatKey, by = 1) {
    try {
      const res = await this.client.post(`/unread/${userId}/decrement`, { chatKey, by }, { timeout: 30000 });
      return res.data?.count ?? null;
    } catch (err) {
      console.error('[UnreadCacheClient] decrement error:', err.message);
      return null;
    }
  }

  
  async seed(userId, counts) {
    try {
      await this.client.post(`/unread/${userId}/seed`, { counts }, { timeout: 30000 });
    } catch (err) {
      console.error('[UnreadCacheClient] seed error:', err.message);
    }
  }

  
  async invalidate(userId) {
    try {
      await this.client.delete(`/unread/${userId}`, { timeout: 30000 });
    } catch (err) {
      console.error('[UnreadCacheClient] invalidate error:', err.message);
    }
  }
}

export default new UnreadCacheClient();
