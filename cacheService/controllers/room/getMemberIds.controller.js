import roomCacheService from '../../services/RoomCacheService.js';

export const getMemberIds = async (req, res) => {
  try {
    const ids = await roomCacheService.getRoomMemberIds(req.params.id);
    if (ids === null) return res.status(404).json({ error: 'Room not found' });
    res.json({ memberIds: ids });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
