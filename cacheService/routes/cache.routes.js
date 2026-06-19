import express from 'express';
import cache from '../services/CacheService.js';

const router = express.Router();

router.post('/', (req, res) => {
  const { key, value, ttl } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: 'Key and value are required' });
  }
  cache.set(key, value, ttl);
  res.status(201).json({ success: true, key, value, ttl });
});

router.get('/:key', (req, res) => {
  const { key } = req.params;
  const value = cache.get(key);
  if (value === null) {
    return res.status(404).json({ error: 'Key not found' });
  }
  res.json({ key, value });
});

router.delete('/:key', (req, res) => {
  const { key } = req.params;
  const deleted = cache.delete(key);
  if (!deleted) {
    return res.status(404).json({ error: 'Key not found' });
  }
  res.json({ success: true, key });
});

router.delete('/', (req, res) => {
  cache.clear();
  res.json({ success: true, message: 'Cache cleared' });
});

export default router;
