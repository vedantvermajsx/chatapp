import roomCacheService from '../../services/RoomCacheService.js';

export const addRoomMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    await roomCacheService.addRoomMember(req.params.id, userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
