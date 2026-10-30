import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const putRoomBlock = wrap('putRoomBlock', async (req, res) => {
  const { username, ips } = req.body || {};
  await blockCache.addRoomBlock(req.params.roomId, req.params.userId, username, Array.isArray(ips) ? ips : []);
  res.json({ ok: true });
});
