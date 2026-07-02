import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const invalidateRoomCount = (req, res) => {
  MessageCountCacheService.invalidateRoom(req.params.roomId);
  res.json({ ok: true });
};
