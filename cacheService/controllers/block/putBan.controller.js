import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const putBan = wrap('putBan', async (req, res) => {
  const { username, reason, expiresAt } = req.body || {};
  await blockCache.addBan({
    userId: req.params.userId,
    username,
    reason,
    expiresAt,
  });
  res.json({ ok: true });
});
