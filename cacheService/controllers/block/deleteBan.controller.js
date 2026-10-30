import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const deleteBan = wrap('deleteBan', async (req, res) => {
  await blockCache.removeBan(req.params.userId);
  res.json({ ok: true });
});
