import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const getRoomCount = async (req, res) => {
  try {
    const count = await MessageCountCacheService.getRoomCount(req.params.roomId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPrivateCount = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const count = await MessageCountCacheService.getPrivateCount(senderId, receiverId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const incrementRoomCount = (req, res) => {
  MessageCountCacheService.incrementRoom(req.params.roomId);
  res.json({ ok: true });
};

export const incrementPrivateCount = (req, res) => {
  const { senderId, receiverId } = req.body;
  if (!senderId || !receiverId) return res.status(400).json({ error: 'senderId and receiverId required' });
  MessageCountCacheService.incrementPrivate(senderId, receiverId);
  res.json({ ok: true });
};

export const invalidateRoomCount = (req, res) => {
  MessageCountCacheService.invalidateRoom(req.params.roomId);
  res.json({ ok: true });
};

export const invalidatePrivateCount = (req, res) => {
  const { senderId, receiverId } = req.params;
  MessageCountCacheService.invalidatePrivate(senderId, receiverId);
  res.json({ ok: true });
};
