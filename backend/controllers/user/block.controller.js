import userCacheClient from '../../database/userCacheClient.js';
import blockCacheClient from '../../database/blockCacheClient.js';
import { getIpsForUser } from '../../utils/blockService.js';
import { enqueueUserBlocked, enqueueUserUnblocked } from '../../utils/queueClient.js';

export async function blockUser(req, res) {
  try {
    const blockerId = String(req.user._id);
    const blockedId = String(req.params.userId);

    if (blockerId === blockedId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const target = await userCacheClient.getUserById(blockedId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const [targetIps, ownIps] = await Promise.all([getIpsForUser(blockedId), getIpsForUser(blockerId)]);
    const own = new Set(ownIps);
    const ips = targetIps.filter(ip => !own.has(ip));

    enqueueUserBlocked({ blockerId, blockedId, blockedUsername: target.username, ips });
    await blockCacheClient.addUserBlock(blockerId, blockedId, target.username, ips)
      .catch(err => console.warn('[blockUser] cache update failed (TTL will catch up):', err.message));

    return res.status(200).json({ message: 'User blocked' });
  } catch (err) {
    console.error('[blockUser] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function unblockUser(req, res) {
  try {
    const blockerId = String(req.user._id);
    const blockedId = String(req.params.userId);

    enqueueUserUnblocked({ blockerId, blockedId });
    await blockCacheClient.removeUserBlock(blockerId, blockedId)
      .catch(err => console.warn('[unblockUser] cache update failed (TTL will catch up):', err.message));

    return res.status(200).json({ message: 'User unblocked' });
  } catch (err) {
    console.error('[unblockUser] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getBlockedUsers(req, res) {
  try {
    const blocked = await blockCacheClient.listUserBlocks(String(req.user._id));
    return res.status(200).json({ blocked });
  } catch (err) {
    console.error('[getBlockedUsers] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
