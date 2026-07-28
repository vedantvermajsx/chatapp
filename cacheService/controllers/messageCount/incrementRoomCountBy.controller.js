import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const incrementRoomCountBy = async (req, res) => {
  const by = req.body.by || 1;
  await MessageCountCacheService.incrementRoom(req.params.roomId, by);
  res.json({ ok: true });
};
