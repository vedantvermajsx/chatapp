import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const incrementRoomCount = (req, res) => {
  MessageCountCacheService.incrementRoom(req.params.roomId);
  res.json({ ok: true });
};
