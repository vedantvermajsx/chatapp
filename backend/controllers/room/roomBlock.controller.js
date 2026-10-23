import roomCacheClient from '../../database/roomCacheClient.js';
import userCacheClient from '../../database/userCacheClient.js';
import blockCacheClient from '../../database/blockCacheClient.js';
import { getIpsForUser } from '../../utils/blockService.js';
import { enqueueRoomUserBlocked, enqueueRoomUserUnblocked } from '../../utils/queueClient.js';

async function getRoomIfAdmin(req, res) {
  const { roomId } = req.params;
  const room = await roomCacheClient.getRoomById(roomId);
  if (!room || room.isDeleted) {
    res.status(404).json({ message: 'Room not found' });
    return null;
  }
  if (String(room.groupAdmin) !== String(req.user._id)) {
    res.status(403).json({ message: 'Only the group admin can do this' });
    return null;
  }
  return room;
}

export async function blockRoomUser(req, res) {
  try {
    const room = await getRoomIfAdmin(req, res);
    if (!room) return;

    const roomId = String(req.params.roomId);
    const targetId = String(req.params.userId);
    const adminId = String(req.user._id);

    if (targetId === adminId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const target = await userCacheClient.getUserById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const [targetIps, adminIps] = await Promise.all([getIpsForUser(targetId), getIpsForUser(adminId)]);
    const own = new Set(adminIps);
    const ips = targetIps.filter(ip => !own.has(ip));

    enqueueRoomUserBlocked({ roomId, userId: targetId, username: target.username, ips });
    await blockCacheClient.addRoomBlock(roomId, targetId, target.username, ips)
      .catch(err => console.warn('[blockRoomUser] cache update failed (TTL will catch up):', err.message));

    return res.status(200).json({ message: 'User blocked from messaging in this group' });
  } catch (err) {
    console.error('[blockRoomUser] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function unblockRoomUser(req, res) {
  try {
    const room = await getRoomIfAdmin(req, res);
    if (!room) return;

    const roomId = String(req.params.roomId);
    const userId = String(req.params.userId);

    enqueueRoomUserUnblocked({ roomId, userId });
    await blockCacheClient.removeRoomBlock(roomId, userId)
      .catch(err => console.warn('[unblockRoomUser] cache update failed (TTL will catch up):', err.message));

    return res.status(200).json({ message: 'User unblocked' });
  } catch (err) {
    console.error('[unblockRoomUser] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getRoomBlockedUsers(req, res) {
  try {
    const room = await getRoomIfAdmin(req, res);
    if (!room) return;
    const blocked = await blockCacheClient.listRoomBlocks(String(req.params.roomId));
    return res.status(200).json({ blocked });
  } catch (err) {
    console.error('[getRoomBlockedUsers] error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
