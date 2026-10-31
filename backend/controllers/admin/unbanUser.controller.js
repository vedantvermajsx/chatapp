import blockCacheClient from '../../database/blockCacheClient.js';
import { enqueueUserUnbanned } from '../../utils/queueClient.js';

export async function unbanUser(req, res) {
  try {
    const userId = String(req.params.userId);

    await blockCacheClient.removeBan(userId)
      .catch(err => console.warn('[unbanUser] cache update failed:', err.message));

    enqueueUserUnbanned({ userId });

    return res.status(200).json({ message: 'User unblocked' });
  } catch (err) {
    console.error('[unbanUser] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
