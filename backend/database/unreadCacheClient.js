import axios from 'axios';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';
dotenv.config();

class UnreadCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 2000, 
    });
    attachHmacInterceptor(this.client);
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
      await this.client.post(`/unread/${userId}/increment`, { chatKey });
    } catch (err) {
      console.error('[UnreadCacheClient] increment error:', err.message);
    }
  }

  async seedRoomOnJoin(userId, roomId) {
    try {
      await this.client.post(`/unread/${userId}/room/${roomId}/join-seed`);
    } catch (err) {
      console.error('[UnreadCacheClient] seedRoomOnJoin error:', err.message);
    }
  }

  
  async incrementPrivate(receiverId, senderId) {
    try {
      await this.client.post(`/unread/${receiverId}/increment`, {
        chatKey: `private_${senderId}`,
      });
    } catch (err) {
      console.error('[UnreadCacheClient] incrementPrivate error:', err.message);
    }
  }

  
  async reset(userId, chatKey) {
    try {
      const res = await this.client.post(`/unread/${userId}/reset`, { chatKey });
      return res.data?.count ?? 0;
    } catch (err) {
      console.error('[UnreadCacheClient] reset error:', err.message);
      return null;
    }
  }

  async decrement(userId, chatKey, by = 1) {
    try {
      const res = await this.client.post(`/unread/${userId}/decrement`, { chatKey, by });
      return res.data?.count ?? null;
    } catch (err) {
      console.error('[UnreadCacheClient] decrement error:', err.message);
      return null;
    }
  }

  
  async seed(userId, counts) {
    try {
      await this.client.post(`/unread/${userId}/seed`, { counts });
    } catch (err) {
      console.error('[UnreadCacheClient] seed error:', err.message);
    }
  }

  
  async invalidate(userId) {
    try {
      await this.client.delete(`/unread/${userId}`);
    } catch (err) {
      console.error('[UnreadCacheClient] invalidate error:', err.message);
    }
  }
}

export default new UnreadCacheClient();
