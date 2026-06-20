import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';
import { userCache } from './CacheService.js';

const USER_TTL_SECONDS = 3600;

const NOT_FOUND_USER = {
  id: '6a2bae6f507740c0347410ff',
  username: 'Deleted User',
  gender: '2',
  role: 'user',
  avatar: 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1781429485/not-found_1_hts9gb.avif',
  isOnline: false,
  lastSeen: 0,
  notFound: true
};

function formatUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    gender: user.gender,
    role: user.role ?? 'guest',
    avatar: user.avatar ?? '',
    isOnline: user.isOnline,
    lastSeen: user.lastSeen
  };
}

class UserCacheService {
  _cacheKey(id) {
    return `user:${id}`;
  }

  _isGuest(id) {
    return String(id).startsWith('guest_');
  }

  _model(id) {
    return this._isGuest(id) ? Guest : User;
  }

  async getUserById(id) {
    const cached = userCache.get(this._cacheKey(id));
    if (cached) return cached;

    const user = await this._model(id).findById(id)
      .select('_id username gender role avatar isOnline lastSeen');

    if (!user) return NOT_FOUND_USER;

    const formatted = formatUser(user);
    userCache.set(this._cacheKey(id), formatted, USER_TTL_SECONDS);
    return formatted;
  }


  async setUser(id, data) {
    userCache.set(this._cacheKey(id), data, USER_TTL_SECONDS);
  }

  async updateUser(id, data) {
    const existing = userCache.get(this._cacheKey(id));
    const updated = existing ? { ...existing, ...data } : data;
    userCache.set(this._cacheKey(id), updated, USER_TTL_SECONDS);
    return updated;
  }

  async deleteUser(id) {
    userCache.delete(this._cacheKey(id));
  }
}

export default new UserCacheService();
