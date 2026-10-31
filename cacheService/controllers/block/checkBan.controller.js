import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const checkBan = wrap('checkBan', async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ message: 'userId required' });
  const ban = await blockCache.getBan(userId);
  res.json({ banned: !!ban, ban: ban || null });
});
