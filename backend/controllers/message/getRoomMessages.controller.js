import userCacheClient from '../../database/userCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import getThumbnail from '../../utils/getThumbnail.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';

function deletedUserFallback() {
  return {
    username: 'Deleted User',
    gender: null,
    avatar: getDefaultAvatar(0),
  };
}

export const getRoomMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId } = req.params;
    const { limit = 20, before, after } = req.query;

    const { messages, hasMore } = await messageCacheClient.getRoomMessages(roomId, {
      userId,
      limit: parseInt(limit, 10),
      before: before || undefined,
      after: after || undefined,
    });


    if (!messages.length) {
      return res.status(200).json({ messages: [], hasMore: false });
    }

    const nonSystemMessages = messages.filter((m) => !m.isSystemMessage);
    const senderIds = [...new Set(nonSystemMessages.map((m) => m.senderId))];
    const userDetailsMap = senderIds.length
      ? await userCacheClient.getUsersByIds(senderIds)
      : new Map();

      const formattedMessages = messages.map((msg) => {
  if (msg.isSystemMessage) {
    return {
      id: msg._id,
      isSystemMessage: true,
      systemType: msg.systemType || null,
      text: msg.content || msg.text || '',
      timestamp: msg.timestamp,
    };
  }

  const senderDetails = userDetailsMap.get(msg.senderId) || deletedUserFallback();

  const media = msg.media?.url
    ? {
        ...msg.media,
        thumbnailUrl: getThumbnail(
          msg.media.url,
          msg.media.type === 'video',
          msg.media.type === 'audio'
        ),
      }
    : null;

  return {
    id: msg._id,
    text: msg.content || msg.text || '',
    isOwn: msg.senderId === userId,
    timestamp: msg.timestamp,
    username: senderDetails.username,
    gender: senderDetails.gender,
    avatar: senderDetails.avatar,
    media,
  };
});

    
    res.status(200).json({ messages: formattedMessages, hasMore });
  } catch (error) {
    console.error('Error getting room messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};