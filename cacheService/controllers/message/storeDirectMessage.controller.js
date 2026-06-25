import { storePrivateMessageDirect } from '../../services/MessageCacheService.js';

export const storeDirectMessage = (req, res) => {
  const { senderId, receiverId, messageId, timestamp } = req.body;

  if (!senderId || !receiverId || !messageId) {
    return res.status(400).json({ error: 'senderId, receiverId and messageId are required' });
  }

  storePrivateMessageDirect({ senderId, receiverId, messageId, timestamp });

  res.json({ success: true });
};