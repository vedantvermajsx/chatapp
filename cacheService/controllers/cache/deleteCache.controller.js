import cache from '../../services/CacheService.js';

export const deleteCache = (req, res) => {
  const { key } = req.params;
  const deleted = cache.delete(key);
  if (!deleted) {
    return res.status(404).json({ error: 'Key not found' });
  }
  res.json({ success: true, key });
};
