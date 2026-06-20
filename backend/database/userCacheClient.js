import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class UserCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('User cache client:', process.env.CACHE_SERVICE_ROOT_URL);
  }

  async getUserById(id) {
    try {
      const res = await this.client.get(`/users/${id}`);
      return res.data;
    } catch (err) {
      if (err.response?.status === 404) return null;
      console.error(`[UserCache] getUserById(${id}):`, err.message);
      return null;
    }
  }

  async getUsersByIds(ids) {
    const userMap = new Map();
    await Promise.all(
      ids.map(async (id) => {
        const user = await this.getUserById(id);
        userMap.set(id, user);
      })
    );
    return userMap;
  }


  async addUserToCache(id, data) {
    try {
      const resolvedData = await data;
      await this.client.post('/users', { id, data: resolvedData });
    } catch (err) {
      console.error(`[UserCache] addUserToCache(${id}):`, err.message);
    }
  }

  async updateUserById(id, data) {
    try {
      const res = await this.client.patch(`/users/${id}`, data);
      return res.data;
    } catch (err) {
      console.error(`[UserCache] updateUserById(${id}):`, err.message);
      return null;
    }
  }

  async deleteUserById(id) {
    try {
      await this.client.delete(`/users/${id}`);
    } catch (err) {
      console.error(`[UserCache] deleteUserById(${id}):`, err.message);
    }
  }
}

export default new UserCacheClient();
