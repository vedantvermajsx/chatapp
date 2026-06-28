import LastReadCacheService from '../../services/LastReadCacheService.js';

/** GET /last-read/:userId/:chatKey  — cache-first, Mongo fallback */
export const getLastRead = async (req, res) => {
  try {
    const { userId, chatKey } = req.params;
    const result = await LastReadCacheService.getOrLoad(userId, chatKey);
    if (!result) return res.status(404).json({ cold: true });
    res.json({ cold: false, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /last-read/:userId/room  — body: { roomId, messageId, lastReadAt } */
export const setRoomLastRead = (req, res) => {
  try {
    const { userId } = req.params;
    const { roomId, messageId, lastReadAt } = req.body;
    if (!roomId) return res.status(400).json({ error: 'roomId required' });
    LastReadCacheService.setRoom(userId, roomId, { messageId, lastReadAt: new Date(lastReadAt) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** POST /last-read/:userId/private  — body: { peerId, messageId, lastSeenAt } */
export const setPrivateLastRead = (req, res) => {
  try {
    const { userId } = req.params;
    const { peerId, messageId, lastSeenAt } = req.body;
    if (!peerId) return res.status(400).json({ error: 'peerId required' });
    LastReadCacheService.setPrivate(userId, peerId, { messageId, lastSeenAt: new Date(lastSeenAt) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** DELETE /last-read/:userId/:chatKey */
export const invalidateLastRead = (req, res) => {
  try {
    const { userId, chatKey } = req.params;
    LastReadCacheService.invalidate(userId, chatKey);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
