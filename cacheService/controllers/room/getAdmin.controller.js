import roomCacheService from '../../services/RoomCacheService.js';

export const getAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = await roomCacheService.getRoomAdmin(id);
    if (!adminId) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json({ adminId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
