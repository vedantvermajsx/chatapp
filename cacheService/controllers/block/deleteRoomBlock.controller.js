import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

export const deleteRoomBlock = wrap('deleteRoomBlock', async (req, res) => {
  await blockCache.removeRoomBlock(req.params.roomId, req.params.userId);
  res.json({ ok: true });
});
