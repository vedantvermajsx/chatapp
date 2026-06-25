import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';
import { userCache } from './CacheService.js';

const USER_TTL_SECONDS = 3600;

const NOT_FOUND_USER = {
  id: '6a2bae6f507740c0347410ff',
  username: 'Deleted User',
  gender: '2',
  role: 'NOT_FOUND',
  avatar:'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1782368437/c7fb3065-1fe7-4b99-ab82-715b4e5d6dd3_eb5znr.avif',
  isOnline: false,
  lastSeen: 0,
  notFound: true
};

function formatUser(user) {
  return {
    id: user._id.toString(),
    username: user.username ?? NOT_FOUND_USER.username,
    gender: user.gender ?? NOT_FOUND_USER.gender,
    role: user.role ?? NOT_FOUND_USER.role,
    avatar: user.avatar ?? NOT_FOUND_USER.avatar,
    isOnline: user.isOnline?? NOT_FOUND_USER.isOnline,
    lastSeen: user.lastSeen?? NOT_FOUND_USER.lastSeen
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

    let user = await this._model(id).findById(id)
      .select('_id username gender role avatar isOnline lastSeen');

   
    if (!user) {
      user = {
        _id: id,
        username: NOT_FOUND_USER.username,
        gender: NOT_FOUND_USER.gender,
        role: NOT_FOUND_USER.role,
        avatar: NOT_FOUND_USER.avatar,
        isOnline: NOT_FOUND_USER.isOnline,
        lastSeen: NOT_FOUND_USER.lastSeen
      };
    }


    const formatted = formatUser(user);
    userCache.set(this._cacheKey(id), formatted, USER_TTL_SECONDS);

    return formatted;
  }

  async setUser(id, data) {
    userCache.set(this._cacheKey(id), data, USER_TTL_SECONDS);
  }

  async updateUser(id, data) {
    const existing = await this.getUserById(id);
    if (existing?.notFound) return null;
    
    const updated = { ...existing, ...data };
    userCache.set(this._cacheKey(id), updated, USER_TTL_SECONDS);
    return updated;
  }

  async deleteUser(id) {
    userCache.delete(this._cacheKey(id));
  }
}

export default new UserCacheService();
