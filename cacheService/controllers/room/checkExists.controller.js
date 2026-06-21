import roomCacheService from '../../services/RoomCacheService.js';

export const checkExists = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await roomCacheService.isValidRoomId(id);
    if (!result) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
