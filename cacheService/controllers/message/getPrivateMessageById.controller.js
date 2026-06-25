import { getPrivateMessageById, storePrivateMessageDirect } from '../../services/MessageCacheService.js';
import Message from '../../models/message.model.js';

export const getPrivateMessageByIdController = async (req, res) => {
  try {
    const { userId, otherUserId, messageId } = req.params;

    const cached = getPrivateMessageById(userId, otherUserId, messageId);
    if (cached) return res.json(cached);

    const message = await Message.findOne(
      {
        _id: messageId,
        senderId: userId,
        receiverId: otherUserId,
        roomId: null,
      },
      { _id: 1, senderId: 1, receiverId: 1, timestamp: 1 }
    ).lean();

    if (!message) return res.status(404).json({ message: 'Message not found' });

    const result = {
      id: message._id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      timestamp: message.timestamp,
    };

    storePrivateMessageDirect({
      senderId: message.senderId,
      receiverId: message.receiverId,
      messageId: message._id,
      timestamp: message.timestamp,
    });

    res.json(result);
  } catch (error) {
    console.error('[CacheService] error getting private message by id:', error);
    res.status(500).json({ message: 'Failed to get message', error: error.message });
  }
};