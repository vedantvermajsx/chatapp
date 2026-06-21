import roomCacheService from '../../services/RoomCacheService.js';

export const hasMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const hasMember = await roomCacheService.hasMember(id, userId);
    res.json({ hasMember });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
