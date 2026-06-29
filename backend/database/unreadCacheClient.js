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
      await this.client.post(`/unread/${userId}/reset`, { chatKey });
    } catch (err) {
      console.error('[UnreadCacheClient] reset error:', err.message);
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
