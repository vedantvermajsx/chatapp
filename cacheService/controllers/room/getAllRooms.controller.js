import roomCacheService from '../../services/RoomCacheService.js';

export const getAllRooms = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const rooms = await roomCacheService.getAllRooms({ search });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
