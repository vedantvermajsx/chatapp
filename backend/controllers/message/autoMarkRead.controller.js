import ConversationRead from '../../models/conversationRead.model.js';
import unreadCacheClient from '../../database/unreadCacheClient.js';
import lastReadCacheClient from '../../database/lastReadCacheClient.js';
import { publish } from '../../utils/messageBroker.js';
import { getIO } from '../../socket.js';

async function autoMarkRead(userId, otherUserId, messages) {
  try {
    const lastMsgFromOther = [...messages]
      .reverse()
      .find((m) => String(m.senderId) === String(otherUserId));

    if (!lastMsgFromOther) return; 

    const messageId = lastMsgFromOther._id;
    const messageTimestamp = lastMsgFromOther.timestamp
      ? new Date(lastMsgFromOther.timestamp)
      : new Date();

    const existing = await ConversationRead.findOne({
      senderId: otherUserId,
      receiverId: userId,
    })
      .select('messageId timestamp')
      .lean();

    if (existing?.messageId === messageId) return;
    if (existing?.timestamp && messageTimestamp <= new Date(existing.timestamp)) return;

    const now = new Date();

    await ConversationRead.findOneAndUpdate(
      { senderId: otherUserId, receiverId: userId },
      { messageId, timestamp: messageTimestamp, lastSeenAt: now },
      { upsert: true, new: true }
    );

    unreadCacheClient.reset(userId, `private_${otherUserId}`).catch(() => {});

    lastReadCacheClient
      .setPrivate(userId, otherUserId, { messageId, lastSeenAt: now })
      .catch(() => {});


      publish('notification.lastread.private', {
      userId,
      peerId: otherUserId,
      messageId,
      lastSeenAt: now.toISOString(),
    });

    const io = getIO();
    if (io) {
      io.to(String(otherUserId)).emit('readReceipt', {
        senderId: otherUserId,   
        receiverId: userId,      
        messageId,
        timestamp: messageTimestamp,
        lastSeenAt: now,
      });
    }
  } catch (err) {
    console.error('[getPrivateMessages] autoMarkRead error:', err.message);
  }
}
export default autoMarkRead;