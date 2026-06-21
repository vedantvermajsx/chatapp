import { invalidateRoomMessages, invalidatePrivateMessages } from '../../services/MessageCacheService.js';

export const invalidateMessages = (req, res) => {
  const { roomId, senderId, receiverId } = req.body;

  if (roomId) {
    invalidateRoomMessages(roomId);
  } else if (senderId && receiverId) {
    invalidatePrivateMessages(senderId, receiverId);
  } else {
    return res.status(400).json({ error: 'roomId or (senderId and receiverId) required' });
  }

  res.json({ success: true });
};
