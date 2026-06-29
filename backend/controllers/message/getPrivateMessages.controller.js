import { messageCacheClient } from '../../database/messageCacheClient.js';
import lastReadCacheClient from '../../database/lastReadCacheClient.js';
import userCacheClient from '../../database/userCacheClient.js';
import { _addQualities } from '../../utils/addQualities.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';

function deletedUserFallback(msg) {
  const gender = msg.gender ?? null;
  return {
    username: msg.username || msg.senderUsername || 'Deleted User',
    avatar: msg.avatar || getDefaultAvatar(gender ?? 0),
    gender,
  };
}



export const getPrivateMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { limit = 20, before, after } = req.query;
    const { user } = req;
    const userId = user._id;

    const [{ messages, hasMore }, theirReadReceipt] = await Promise.all([
      messageCacheClient.getPrivateMessages(
        userId,
        otherUserId,
        {
          limit: parseInt(limit, 10),
          before: before || undefined,
          after: after || undefined,
        }
      ),
      lastReadCacheClient.get(otherUserId, `private_${userId}`),
    ]);

    const lastRead = {
      messageId: theirReadReceipt?.messageId ?? null,
      seenAt: theirReadReceipt?.lastSeenAt ?? null,
    };

    if (!messages || !messages.length) {
      return res.status(200).json({ messages: [], hasMore: false, lastRead });
    }

    const participantIds = [...new Set([userId, otherUserId])];
    const userDetailsMap = await userCacheClient.getUsersByIds(participantIds);

    const formattedMessages = messages.map((msg) => {
      const isOwn = String(msg.senderId) === String(userId);

      const senderDetails = userDetailsMap.get(msg.senderId) || deletedUserFallback(msg);

      return {
        _id: msg._id || msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        username: senderDetails.username,
        avatar: senderDetails.avatar,
        gender: senderDetails.gender,
        isSystemMessage:msg.isSystemMessage,
        systemType:msg.systemType,  
        text: msg.content || msg.text || '',
        isOwn,
        timestamp: msg.timestamp,
        media:msg.media?_addQualities(msg.media):null,
      };
    });

    res.status(200).json({ messages: formattedMessages, hasMore, lastRead });
  } catch (error) {
    console.error('Error getting private messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};