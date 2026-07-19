import axios from 'axios';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';
dotenv.config();

class MessageCountCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 1000 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 1000 }),
    });
    attachHmacInterceptor(this.client);
    this.incrementBatch = new Map();
    this.batchTimer = null;
  }

  async getRoomCount(roomId) {
    try {
      const res = await this.client.get(`/message-count/room/${roomId}`);
      return res.data.count;
    } catch (err) {
      console.error('[MessageCountCacheClient] getRoomCount error:', err.message);
      return null;
    }
  }

  async getPrivateCount(senderId, receiverId) {
    try {
      const res = await this.client.get(`/message-count/private/${senderId}/${receiverId}`);
      return res.data.count;
    } catch (err) {
      console.error('[MessageCountCacheClient] getPrivateCount error:', err.message);
      return null;
    }
  }

  async incrementRoom(roomId) {
    const current = this.incrementBatch.get(roomId) || 0;
    this.incrementBatch.set(roomId, current + 1);

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this._flushIncrementBatch(), 200);
    }
  }

  async _flushIncrementBatch() {
    this.batchTimer = null;
    const batches = this.incrementBatch;
    this.incrementBatch = new Map();

    for (const [roomId, count] of batches.entries()) {
      try {
        await this.client.post(`/message-count/room/${roomId}/increment-by`, { by: count }, { timeout: 30000 });
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            for (let i = 0; i < count; i++) {
              await this.client.post(`/message-count/room/${roomId}/increment`, undefined, { timeout: 30000 });
            }
          } catch (e) {
            console.error('[MessageCountCacheClient] fallback incrementRoom error:', e.message);
          }
        } else {
          console.error('[MessageCountCacheClient] incrementRoom error:', err.message);
        }
      }
    }
  }

  async incrementPrivate(senderId, receiverId) {
    try {
      await this.client.post('/message-count/private/increment', { senderId, receiverId }, { timeout: 30000 });
    } catch (err) {
      console.error('[MessageCountCacheClient] incrementPrivate error:', err.message);
    }
  }

  async invalidateRoom(roomId) {
    try {
      await this.client.delete(`/message-count/room/${roomId}`, { timeout: 30000 });
    } catch (err) {
      console.error('[MessageCountCacheClient] invalidateRoom error:', err.message);
    }
  }

  async invalidatePrivate(senderId, receiverId) {
    try {
      await this.client.delete(`/message-count/private/${senderId}/${receiverId}`, { timeout: 30000 });
    } catch (err) {
      console.error('[MessageCountCacheClient] invalidatePrivate error:', err.message);
    }
  }
}

export default new MessageCountCacheClient();
