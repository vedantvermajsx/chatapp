import UserDatabase from './UserDatabase.js';
import { cache } from '../utils/cacheService.js';

class UserCache {
  constructor() {
    this.db = UserDatabase;
  }

  async addUserToCache(id, data) {
    const resolvedData = await data;
    await cache.set(`user:${id}`, resolvedData, 3600); 
  }

  async getUserById(id) {
    let user = await cache.get(`user:${id}`);

    if(!user){
      user = await this.db.getUserById(id, !id.startsWith('guest_'));
      if (user) {
        await cache.set(`user:${id}`, user, 3600);
      }
    }

    return user;
  }

  async getUsersByIds(ids) {
    const userMap = new Map();
    for (const id of ids) {
      const user = await this.getUserById(id);
      userMap.set(id, user);
    }
    return userMap;
  }

  async updateUserById(id, data){
    let user = await this.getUserById(id);

    if(!user){
      return null;
    }

    user = {...user, ...data};
    await cache.set(`user:${id}`, user, 3600);
    await this.db.updateUserById(id, data, !id.startsWith('guest_'));

    return user;
  }

  async deleteUserById(id) {
    await cache.delete(`user:${id}`);
    await this.db.deleteUserById(id, !id.startsWith('guest_'));
  }
}

export default new UserCache();