import roomCacheService from '../../services/RoomCacheService.js';

export const getUserJoinedRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    const rooms = await roomCacheService.getUserJoinedRooms(userId);
    res.json({ data: rooms, hasMore: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
