import userCacheClient from '../../database/userCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';
import { _addQualities } from '../../utils/addQualities.js';
import { applyUnreadOnFetch } from '../../utils/applyUnreadOnFetch.js';

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
      const unreadCount = await applyUnreadOnFetch({
        userId,
        chatKey: `room_${roomId}`,
        hasMore: false,
        messages: [],
      });
      return res.status(200).json({ messages: [], hasMore: false, unreadCount });
    }

    const nonSystemMessages = messages.filter((m) => !m.isSystemMessage);
    const senderIds = [...new Set(nonSystemMessages.map((m) => m.senderId))];
    const userDetailsMap = senderIds.length
      ? await userCacheClient.getUsersByIds(senderIds)
      : new Map();

      const formattedMessages = messages.map((msg) => {
  if (msg.isSystemMessage) {
    return {
      _id: msg._id || msg.id,
      isSystemMessage: true,
      systemType: msg.systemType || null,
      text: msg.content || msg.text || '',
      timestamp: msg.timestamp,
    };
  }

  const cachedSender = userDetailsMap.get(msg.senderId);
  const senderDetails = cachedSender && cachedSender.username ? cachedSender : deletedUserFallback();

  return {
    _id: msg._id || msg.id,
    text: msg.content || msg.text || '',
    isOwn: msg.senderId === userId,
    timestamp: msg.timestamp,
    username: senderDetails.username,
    gender: senderDetails.gender,
    avatar: senderDetails.avatar,
    media:msg.media?_addQualities(msg.media):null,
    taggedUser: msg.taggedUser,
  };
});

    const unreadCount = await applyUnreadOnFetch({
      userId,
      chatKey: `room_${roomId}`,
      hasMore,
      messages,
    });

    res.status(200).json({ messages: formattedMessages, hasMore, unreadCount });
  } catch (error) {
    console.error('Error getting room messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};