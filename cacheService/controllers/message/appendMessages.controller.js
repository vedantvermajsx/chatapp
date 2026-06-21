import { appendRoomMessages, appendPrivateMessages } from '../../services/MessageCacheService.js';

export const appendMessages = (req, res) => {
  const { roomId, senderId, receiverId, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  if (roomId) {
    appendRoomMessages(roomId, messages);
  } else if (senderId && receiverId) {
    appendPrivateMessages(senderId, receiverId, messages);
  } else {
    return res.status(400).json({ error: 'roomId or (senderId and receiverId) required' });
  }

  res.json({ success: true });
};
