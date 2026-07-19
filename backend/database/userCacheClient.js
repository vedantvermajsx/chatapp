import axios from 'axios';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';

dotenv.config();

class UserCacheClient {
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

  async seedUser(userDoc, { retries = 2, retryDelayMs = 150 } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.client.post('/users/seed', userDoc, { timeout: 30000 });
        return;
      } catch (err) {
        lastErr = err;
        console.warn(
          `[UserCacheClient] seedUser attempt ${attempt + 1}/${retries + 1} failed for ${userDoc._id}: ${err.message}`
        );
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
        }
      }
    }
    throw new Error(`seedUser failed after ${retries + 1} attempts: ${lastErr.message}`);
  }

  async checkDuplicate(username, email) {
    try {
      const res = await this.client.post('/users/check-duplicate', { username, email });
      return res.data;
    } catch (err) {
      console.error('[UserCacheClient] checkDuplicate error:', err.message);
      return { taken: false };
    }
  }

  async getUserById(userId) {
    try {
      const res = await this.client.get(`/users/${userId}`);
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      console.error('[UserCacheClient] getUserById error:', err.message);
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      const res = await this.client.get(`/users/by-username/${encodeURIComponent(username)}`);
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      console.error('[UserCacheClient] getUserByUsername error:', err.message);
      return null;
    }
  }

  async addUserToCache(userId, dataPromise) {
    try {
      const data = await dataPromise;
      await this.client.put(`/users/${userId}`, data, { timeout: 30000 });
    } catch (err) {
      console.warn('[UserCacheClient] addUserToCache error:', err.message);
    }
  }

  async getUsersByIds(userIds) {
    const uniqueIds = [...new Set((userIds || []).filter(Boolean).map(String))];
    if (uniqueIds.length === 0) return new Map();
    try {
      const res = await this.client.post('/users/batch', { ids: uniqueIds });
      return new Map(Object.entries(res.data || {}));
    } catch (err) {
      console.error('[UserCacheClient] getUsersByIds error:', err.message);
      return new Map();
    }
  }

  async updateUserById(userId, patch) {
    try {
      await this.client.put(`/users/${userId}`, patch, { timeout: 30000 });
    } catch (err) {
      console.warn('[UserCacheClient] updateUserById error:', err.message);
    }
  }

  async deleteUserById(userId, data) {
    try {
      await this.client.delete(`/users/${userId}`, { data, timeout: 30000 });
    } catch (err) {
      console.warn('[UserCacheClient] deleteUserById error:', err.message);
    }
  }

  invalidate(userId) {
    this.client.delete(`/users/${userId}/cache`, { timeout: 30000 }).catch((err) => {
      console.error('[UserCacheClient] invalidate error:', err.message);
    });
  }
}

export default new UserCacheClient();