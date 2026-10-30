import blockCache from '../../services/BlockCacheService.js';
import { wrap } from './wrap.js';

// Is `userId` blocked by `peerId`? (peer is the blocker)
export const checkBlockedBy = wrap('checkBlockedBy', async (req, res) => {
  const { userId, peerId } = req.body || {};
  if (!userId || !peerId) return res.status(400).json({ message: 'userId and peerId required' });
  res.json({ blockedBy: await blockCache.isBlockedBy(userId, peerId) });
});
