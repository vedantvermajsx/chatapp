import userCache from '../../database/userCache.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';

export const getPrivateMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { limit = 20, before } = req.query;
    const { user } = req;
    const userId = user.id;

    const { messages, hasMore } = await messageCacheClient.getPrivateMessages(
      userId,
      otherUserId,
      { limit, before }
    );

    const userIds = [
      ...new Set(messages.flatMap((m) => [m.senderId, m.receiverId]))
    ];
    const userDetailsMap = await userCache.getUsersByIds(userIds);

    const formattedMessages = messages.map((msg) => {
      const senderDetails = userDetailsMap.get(msg.senderId) || {
        username: 'Deleted User',
        gender: null,
        avatar: null,
        isOnline: false,
        lastSeen: null
      };

      return {
        id: msg.id,
        username: senderDetails.username,
        text: msg.text,
        isOwn: msg.senderId === userId,
        timestamp: msg.timestamp,
        gender: senderDetails.gender,
        avatar: senderDetails.avatar,
        isOnline: senderDetails.isOnline,
        lastSeen: senderDetails.lastSeen,
        media: msg.media || null
      };
    });

    formattedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.status(200).json({ messages: formattedMessages, hasMore });
  } catch (error) {
    console.error('Error getting private messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};
