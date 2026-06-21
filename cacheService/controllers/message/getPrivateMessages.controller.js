import { getPrivateMessages as getPrivateMessagesService } from '../../services/MessageCacheService.js';

function mapPrivateMessage(msg) {
  return {
    id: msg._id,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    text: msg.content,
    timestamp: msg.timestamp,
    media: msg.media || null,
  };
}

export const getPrivateMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { limit = 20, before, after } = req.query;

    const result = await getPrivateMessagesService({
      userId,
      otherUserId,
      limit,
      before,
      after,
      mapMessage: mapPrivateMessage,
    });

    res.json(result);
  } catch (error) {
    console.error('[CacheService] error getting private messages:', error);
    res.status(500).json({ message: 'Failed to get private messages', error: error.message });
  }
};
