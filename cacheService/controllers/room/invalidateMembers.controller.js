import roomCacheService from '../../services/RoomCacheService.js';

export const invalidateMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { maxMembers, pageSize } = req.body;
    await roomCacheService.invalidateRoomMembers(id, { maxMembers, pageSize });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
