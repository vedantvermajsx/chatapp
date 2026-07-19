import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const incrementRoomCountBy = (req, res) => {
  const by = req.body.by || 1;
  MessageCountCacheService.incrementRoom(req.params.roomId, by);
  res.json({ ok: true });
};
