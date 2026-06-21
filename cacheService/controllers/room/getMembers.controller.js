import roomCacheService from '../../services/RoomCacheService.js';

export const getMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search || '';

    const result = await roomCacheService.getRoomMembers(id, { skip, limit, search });
    if (result === null) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
