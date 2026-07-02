import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const getRoomCount = async (req, res) => {
  try {
    const count = await MessageCountCacheService.getRoomCount(req.params.roomId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
