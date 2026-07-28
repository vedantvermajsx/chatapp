import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const incrementRoomCount = async (req, res) => {
  await MessageCountCacheService.incrementRoom(req.params.roomId);
  res.json({ ok: true });
};
