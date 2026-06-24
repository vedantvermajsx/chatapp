import { messageCacheClient } from '../../database/messageCacheClient.js';
import ConversationRead from '../../models/conversationRead.model.js';
import userCacheClient from '../../database/userCacheClient.js';

export const getPrivateMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { limit = 20, before, after } = req.query;
    const { user } = req;
    const userId = user.id;

    const { messages, hasMore } = await messageCacheClient.getPrivateMessages(userId, otherUserId, {
      limit: parseInt(limit, 10),
      before: before || undefined,
      after: after || undefined,
    });

    if (!messages || !messages.length) {
      return res.status(200).json({ messages: [], hasMore: false });
    }

    // The ConversationRead record where senderId=otherUserId, receiverId=userId
    // tells us when the OTHER person last read OUR messages
    const theirReadReceipt = await ConversationRead.findOne({
      senderId: otherUserId,
      receiverId: userId,
    });

    // Fetch avatar/username for both participants (cache will batch this efficiently)
    const participantIds = [...new Set([userId, otherUserId])];
    const userDetailsMap = await userCacheClient.getUsersByIds(participantIds);

    const formattedMessages = messages.map((msg) => {
      const isOwn = msg.senderId === userId;

      // Resolve sender details — prefer cache over what's stored on the message
      const senderDetails = userDetailsMap.get(msg.senderId) || {
        username: msg.username || msg.senderUsername || 'Unknown',
        avatar: msg.avatar || null,
        gender: msg.gender || null,
      };

      // Mark seenAt on own messages if the other person has read past this point
      let seenAt = null;
      if (isOwn && theirReadReceipt) {
        const msgTime = new Date(msg.timestamp).getTime();
        const seenTime = new Date(theirReadReceipt.lastSeenAt).getTime();
        if (msg.id === theirReadReceipt.messageId || msgTime <= seenTime) {
          seenAt = theirReadReceipt.lastSeenAt;
        }
      }

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
        media: msg.media || null,
        seenAt,
      };
    });

    // Ensure chronological order
    formattedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.status(200).json({ messages: formattedMessages, hasMore });
  } catch (error) {
    console.error('Error getting private messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};
