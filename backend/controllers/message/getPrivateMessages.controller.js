import { messageCacheClient } from '../../database/messageCacheClient.js';
import ConversationRead from '../../models/conversationRead.model.js';
import userCacheClient from '../../database/userCacheClient.js';
import getThumbnail from '../../utils/getThumbnail.js';

export const getPrivateMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { limit = 20, before, after } = req.query;
    const { user } = req;
    const userId = user.id;

    

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

    const theirReadReceipt = await ConversationRead.findOne({
      senderId: otherUserId,
      receiverId: userId,
    });

    const participantIds = [...new Set([userId, otherUserId])];
    const userDetailsMap = await userCacheClient.getUsersByIds(participantIds);

    console.log(userDetailsMap);

    const formattedMessages = messages.map((msg) => {
      const isOwn = msg.senderId === userId;

      const senderDetails = userDetailsMap.get(msg.senderId) || {
        username: msg.username || msg.senderUsername || 'Unknown',
        avatar: msg.avatar || null,
        gender: msg.gender || null,
      };

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
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        username: senderDetails.username,
        avatar: senderDetails.avatar,
        gender: senderDetails.gender,
        text: msg.content || msg.text || '',
        isOwn,
        timestamp: msg.timestamp,
        media,
        isSeen: false, 
        seenAt: null,  
      };
    });
    if (theirReadReceipt) {
      const idx = formattedMessages.findIndex(
        (msg) => msg.isOwn && msg.id === theirReadReceipt.messageId
      );
      if (idx !== -1) {
        formattedMessages[idx] = {
          ...formattedMessages[idx],
          isSeen: true,
          seenAt: theirReadReceipt.lastSeenAt,
        };
      }
    }

    res.status(200).json({ messages: formattedMessages, hasMore });
  } catch (error) {
    console.error('Error getting private messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};