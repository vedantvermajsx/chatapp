import userCacheClient from '../../database/userCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';

export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 20, before, after } = req.query;

    const { messages, hasMore } = await messageCacheClient.getRoomMessages(roomId, {
      limit: parseInt(limit, 10),
      before: before || undefined,
      after: after || undefined,
    });

    if (!messages.length) {
      return res.status(200).json({ messages: [], hasMore: false });
    }

    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    const userDetailsMap = await userCacheClient.getUsersByIds(senderIds);

    const formattedMessages = messages.map((msg) => {
      const senderDetails = userDetailsMap.get(msg.senderId) || {
        username: 'Deleted User',
        gender: null,
        avatar: null,
      };

      const formatted = {
        id: msg.id,
        text: msg.text,
        isOwn: msg.senderId === req.user.id,
        timestamp: msg.timestamp,
        username: senderDetails.username,
        gender: senderDetails.gender,
        avatar: senderDetails.avatar,
      };
      if (msg.media) formatted.media = msg.media;
      return formatted;
    });

    formattedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.status(200).json({ messages: formattedMessages, hasMore });
  } catch (error) {
    console.error('Error getting room messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};
