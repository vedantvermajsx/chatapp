import roomCacheService from '../../services/RoomCacheService.js';

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    await roomCacheService.deleteRoomCache(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
