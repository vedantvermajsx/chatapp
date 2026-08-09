import { getRoomMessageById } from '../../services/MessageCacheService.js';
import Message from '../../models/message.model.js';

export const getRoomMessageByIdController = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;

    const cached = getRoomMessageById(roomId, messageId);
    if (cached) return res.json(cached);

    const message = await Message.findOne(
      { _id: messageId, roomId },
      { _id: 1, senderId: 1, timestamp: 1, content: 1, media: 1, iv: 1, wrappedKey: 1 }
    ).lean();

    if (!message) return res.status(404).json({ message: 'Message not found' });

    const result = {
      id: message._id,
      senderId: message.senderId,
      roomId,
      timestamp: message.timestamp,
      text: message.content || '',
      media: message.media || null,
      iv: message.iv || null,
      wrappedKey: message.wrappedKey || null,
    };

    res.json(result);
  } catch (error) {
    console.error('[CacheService] error getting room message by id:', error);
    res.status(500).json({ message: 'Failed to get message', error: error.message });
  }
};
