import roomCacheService from '../../services/RoomCacheService.js';

export const getRoomsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const rooms = await roomCacheService.getRoomsByUserId(userId);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
