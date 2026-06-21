import cache from '../../services/CacheService.js';

export const setCache = (req, res) => {
  const { key, value, ttl } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Key and value are required' });
  }
  cache.set(key, value, ttl);
  res.status(201).json({ success: true, key, value, ttl });
};
