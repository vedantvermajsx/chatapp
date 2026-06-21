import cache from '../../services/CacheService.js';

export const getCache = (req, res) => {
  const { key } = req.params;
  const value = cache.get(key);
  if (value === null) {
    return res.status(404).json({ error: 'Key not found' });
  }
  res.json({ key, value });
};
