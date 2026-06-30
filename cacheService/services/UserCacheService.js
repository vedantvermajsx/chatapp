import { userCache } from './CacheService.js';
import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';

const isGuestId = (id) => String(id).startsWith('guest_');

const USER_TTL  = null; 
const INDEX_TTL = null; 

function userKey(userId)   { return `user:${userId}`; }
function usernameKey(name) { return `user:username:${name.toLowerCase()}`; }
function emailKey(email)   { return `user:email:${email.toLowerCase()}`; }

function sanitize(user) {
  if (!user) return user;
  const { password, email, ...safe } = user;
  return safe;
}

const UserCacheService = {

  _seed(user) {
    const id = String(user._id);
    const safe = sanitize(user);
    userCache.set(userKey(id), safe, USER_TTL);
    if (user.username) userCache.set(usernameKey(user.username), id, INDEX_TTL);
    if (user.email)    userCache.set(emailKey(user.email),       id, INDEX_TTL);
    return safe;
  },

  seedUser(userDoc) {
    this._seed(userDoc);
    console.log(`[UserCacheService] seeded user ${userDoc._id} into cache`);
  },

  setUser(id, data) {
    const merged = { ...data, _id: id };
    this._seed(merged);
    console.log(`[UserCacheService] set user ${id} in cache`);
  },

  async updateUser(id, patch) {
    const Model = isGuestId(id) ? Guest : User;
    const persisted = await Model.findByIdAndUpdate(
      id,
      { $set: patch },
      { new: true }
    ).lean();

    if (!persisted) {
      const existing = userCache.get(userKey(id)) || {};
      const updated = { ...existing, ...patch, _id: id };
      this._seed(updated);
      console.log(`[UserCacheService] updated user ${id} in cache only (not found in DB)`);
      return updated;
    }

    const updated = this._seed(persisted);
    console.log(`[UserCacheService] updated user ${id} in DB and cache`);
    return updated;
  },

  deleteUser(id) {
    const u = userCache.get(userKey(id));
    if (u) {
      if (u.username) userCache.delete(usernameKey(u.username));
      if (u.email)    userCache.delete(emailKey(u.email));
    }
    userCache.delete(userKey(id));
    console.log(`[UserCacheService] deleted user ${id} from cache`);
  },

  async getUserById(userId) {
    const cached = userCache.get(userKey(userId));
    if (cached) return cached;

    const user = isGuestId(userId)
      ? await Guest.findById(userId).lean()
      : await User.findById(userId).lean();

    if (!user) return null;
    return this._seed(user);
  },

  async getUserByUsername(username) {
    const cachedId = userCache.get(usernameKey(username));
    if (cachedId) {
      const u = userCache.get(userKey(cachedId));
      if (u) return u;
    }

    const user = await User.findOne({ username }).lean()
      || await Guest.findOne({ username }).lean();

    if (!user) return null;
    return this._seed(user);
  },

  async getUserByEmail(email) {
    const cachedId = userCache.get(emailKey(email));
    if (cachedId) {
      const u = userCache.get(userKey(cachedId));
      if (u) return u;
    }
    const user = await User.findOne({ email }).lean();
    if (!user) return null;
    return this._seed(user);
  },

  async checkDuplicate(username, email) {
    if (userCache.get(usernameKey(username))) return { taken: true, field: 'username' };
    if (email && userCache.get(emailKey(email))) return { taken: true, field: 'email' };

    const query = email
      ? { $or: [{ email }, { username }] }
      : { username };

    const existing = await User.findOne(query).select('_id email username').lean();
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      const idxKey = field === 'email' ? emailKey(email) : usernameKey(username);
      userCache.set(idxKey, String(existing._id), INDEX_TTL);
      return { taken: true, field };
    }

    const existingGuest = await Guest.findOne({ username }).select('_id username').lean();
    if (existingGuest) {
      userCache.set(usernameKey(username), String(existingGuest._id), INDEX_TTL);
      return { taken: true, field: 'username' };
    }

    return { taken: false };
  },

  invalidate(userId) {
    const u = userCache.get(userKey(userId));
    if (u) {
      if (u.username) userCache.delete(usernameKey(u.username));
      if (u.email)    userCache.delete(emailKey(u.email));
    }
    userCache.delete(userKey(userId));
  },
};

export default UserCacheService;