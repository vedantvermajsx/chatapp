import roomCacheService from '../../services/RoomCacheService.js';

export const getRoomByName = async (req, res) => {
  try {
    const { name } = req.params;
    const room = await roomCacheService.getRoomByName(name);
    res.json(room); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
