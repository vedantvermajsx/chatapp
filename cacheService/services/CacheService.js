class CacheService {
  constructor(maxSize = 5000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      evictions: 0,
      maxSize: maxSize
    };
  }

  set(key, value, ttl = null) {
    const now = Date.now();
    const expiry = ttl ? now + (ttl * 1000) : null;

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }

    this.cache.set(key, { value, expiry });
    this.stats.sets++;
    return true;
  }

  get(key) {
    const now = Date.now();
    const item = this.cache.get(key);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    if (item.expiry && now > item.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.cache.delete(key);
    this.cache.set(key, item);
    this.stats.hits++;
    return item.value;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  clear() {
    this.cache.clear();
    this.stats.clears++;
    return true;
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size
    };
  }
}

export const userCache = new CacheService(5000);
export const messageCache = new CacheService(5000);
export const roomCache = new CacheService(5000);
export default userCache;
