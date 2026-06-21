import cache from '../../services/CacheService.js';

export const clearCache = (req, res) => {
  cache.clear();
  res.json({ success: true, message: 'Cache cleared' });
};
