import LastReadCacheService from '../../services/LastReadCacheService.js';

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

export const setRoomLastRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roomId, messageId, lastReadAt } = req.body;
    if (!roomId) return res.status(400).json({ error: 'roomId required' });
    await LastReadCacheService.setRoom(userId, roomId, { messageId, lastReadAt: new Date(lastReadAt) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const setPrivateLastRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const { peerId, messageId, timestamp, lastSeenAt } = req.body;
    if (!peerId) return res.status(400).json({ error: 'peerId required' });
    await LastReadCacheService.setPrivate(userId, peerId, {
      messageId,
      timestamp: timestamp ? new Date(timestamp) : null,
      lastSeenAt: new Date(lastSeenAt),
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const invalidateLastRead = (req, res) => {
  try {
    const { userId, chatKey } = req.params;
    LastReadCacheService.invalidate(userId, chatKey);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
