import roomCacheService from '../../services/RoomCacheService.js';

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await roomCacheService.getRoomById(id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
