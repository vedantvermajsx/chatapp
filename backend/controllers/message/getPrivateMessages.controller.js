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
      // Cache-first, Mongo-fallback via the cache service — this is "have
      // they (otherUserId) read any of *my* (userId's) messages, and up to
      // which one?" Always fetched, even if this page comes back empty,
      // since the frontend needs {messageId, seenAt} regardless of paging.
      lastReadCacheClient.get(otherUserId, `private_${userId}`),
    ]);

    // Only ever the single message they've actually read up to — the
    // frontend is responsible for matching this messageId against its own
    // message list and marking just that one bubble as seen.
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
        id: msg._id || msg.id  ,
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