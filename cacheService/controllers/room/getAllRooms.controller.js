import roomCacheService from '../../services/RoomCacheService.js';

export const getAllRooms = async (req, res) => {
  try {
    const { search = '' } = req.query;
    const skip = Math.max(0, parseInt(req.query.skip) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const { rooms, total } = await roomCacheService.getAllRooms({ search, skip, limit });
    res.json({ rooms, total, skip, limit, hasMore: skip + rooms.length < total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
