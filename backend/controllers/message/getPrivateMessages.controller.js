import { messageCacheClient } from '../../database/messageCacheClient.js';
import ConversationRead from '../../models/conversationRead.model.js';
import userCacheClient from '../../database/userCacheClient.js';
import getThumbnail from '../../utils/getThumbnail.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';
import autoMarkRead from './autoMarkRead.controller.js';

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

    const { messages, hasMore } = await messageCacheClient.getPrivateMessages(
      userId,
      otherUserId,
      {
        limit: parseInt(limit, 10),
        before: before || undefined,
        after: after || undefined,
      }
    );

    if (!messages || !messages.length) {
      return res.status(200).json({ messages: [], hasMore: false });
    }

    if (!before && !after) {
      autoMarkRead(userId, otherUserId, messages);
    }

    const theirReadReceipt = await ConversationRead.findOne({
      senderId: userId,
      receiverId: otherUserId,
    }).lean();

    const participantIds = [...new Set([userId, otherUserId])];
    const userDetailsMap = await userCacheClient.getUsersByIds(participantIds);

    const seenUpTo = theirReadReceipt?.timestamp
      ? new Date(theirReadReceipt.timestamp)
      : null;
    const seenAt = theirReadReceipt?.lastSeenAt ?? null;

    const formattedMessages = messages.map((msg) => {
      const isOwn = String(msg.senderId) === String(userId);

      const senderDetails = userDetailsMap.get(msg.senderId) || deletedUserFallback(msg);

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

      const msgTime = msg.timestamp ? new Date(msg.timestamp) : null;
      const isSeen = isOwn && seenUpTo !== null && msgTime !== null && msgTime <= seenUpTo;

      return {
        id: msg._id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        username: senderDetails.username,
        avatar: senderDetails.avatar,
        gender: senderDetails.gender,
        text: msg.content || msg.text || '',
        isOwn,
        timestamp: msg.timestamp,
        media,
        isSeen,
        seenAt: isSeen ? seenAt : null,
      };
    });

    res.status(200).json({ messages: formattedMessages, hasMore });
  } catch (error) {
    console.error('Error getting private messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};