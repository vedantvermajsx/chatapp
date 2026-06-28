import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class UserCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 3000,
    });
  }

  async seedUser(userDoc) {
    try {
      await this.client.post('/users/seed', userDoc);
    } catch (err) {
      console.warn('[UserCacheClient] seedUser error:', err.message);
    }
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
      await this.client.put(`/users/${userId}`, data);
    } catch (err) {
      console.warn('[UserCacheClient] addUserToCache error:', err.message);
    }
  }

  async getUsersByIds(userIds) {
    const map = new Map();
    await Promise.all(
      userIds.map(async (id) => {
        const user = await this.getUserById(id);
        if (user) map.set(String(id), user);
      })
    );
    return map;
  }

  async updateUserById(userId, patch) {
    try {
      await this.client.put(`/users/${userId}`, patch);
    } catch (err) {
      console.warn('[UserCacheClient] updateUserById error:', err.message);
    }
  }

  async deleteUserById(userId) {
    try {
      await this.client.delete(`/users/${userId}`);
    } catch (err) {
      console.warn('[UserCacheClient] deleteUserById error:', err.message);
    }
  }

  invalidate(userId) {
    this.client.delete(`/users/${userId}/cache`).catch((err) => {
      console.error('[UserCacheClient] invalidate error:', err.message);
    });
  }
}

export default new UserCacheClient();
