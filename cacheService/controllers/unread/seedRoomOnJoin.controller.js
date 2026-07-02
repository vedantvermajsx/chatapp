import UnreadCacheService from '../../services/UnreadCacheService.js';

export const seedRoomOnJoin = async (req, res) => {
  const { userId, roomId } = req.params;
  try {
    await UnreadCacheService.seedRoomOnJoin(userId, roomId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[unread.controller] seedRoomOnJoin error:', err);
    res.status(500).json({ error: err.message });
  }
};
