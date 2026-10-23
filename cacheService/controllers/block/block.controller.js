import blockCache from '../../services/BlockCacheService.js';

const wrap = (name, fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error(`[BlockCache] ${name} error:`, err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserIps = wrap('getUserIps', async (req, res) => {
  res.json({ ips: await blockCache.getUserIps(req.params.userId) });
});

export const checkPrivate = wrap('checkPrivate', async (req, res) => {
  const { senderId, receiverId, senderIp } = req.body || {};
  if (!senderId || !receiverId) return res.status(400).json({ message: 'senderId and receiverId required' });
  res.json({ blocked: await blockCache.isBlockedPrivate(senderId, receiverId, senderIp) });
});

export const checkRoom = wrap('checkRoom', async (req, res) => {
  const { roomId, senderId, senderIp } = req.body || {};
  if (!roomId || !senderId) return res.status(400).json({ message: 'roomId and senderId required' });
  res.json({ blocked: await blockCache.isBlockedInRoom(roomId, senderId, senderIp) });
});

export const listUserBlocks = wrap('listUserBlocks', async (req, res) => {
  res.json({ blocked: await blockCache.listUserBlocks(req.params.blockerId) });
});

export const putUserBlock = wrap('putUserBlock', async (req, res) => {
  const { username, ips } = req.body || {};
  await blockCache.addUserBlock(req.params.blockerId, req.params.blockedId, username, Array.isArray(ips) ? ips : []);
  res.json({ ok: true });
});

export const deleteUserBlock = wrap('deleteUserBlock', async (req, res) => {
  await blockCache.removeUserBlock(req.params.blockerId, req.params.blockedId);
  res.json({ ok: true });
});

export const listRoomBlocks = wrap('listRoomBlocks', async (req, res) => {
  res.json({ blocked: await blockCache.listRoomBlocks(req.params.roomId) });
});

export const putRoomBlock = wrap('putRoomBlock', async (req, res) => {
  const { username, ips } = req.body || {};
  await blockCache.addRoomBlock(req.params.roomId, req.params.userId, username, Array.isArray(ips) ? ips : []);
  res.json({ ok: true });
});

export const deleteRoomBlock = wrap('deleteRoomBlock', async (req, res) => {
  await blockCache.removeRoomBlock(req.params.roomId, req.params.userId);
  res.json({ ok: true });
});
