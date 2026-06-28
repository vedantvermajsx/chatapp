import ConversationRead from '../models/conversationRead.model.js';
import { getIO } from '../socket.js';
import unreadCacheClient from '../database/unreadCacheClient.js';
import lastReadCacheClient from '../database/lastReadCacheClient.js';
import { publish } from '../utils/messageBroker.js';

const handleMarkRead = (socket, io) => async ({ senderId, receiverId, messageId, timestamp }) => {
  if (!senderId || !receiverId || !messageId) return;

  const userId = String(socket.user._id || socket.user.id);

  if (receiverId !== userId) {
    socket.emit('error', { message: 'Forbidden' });
    return;
  }

  const messageTimestamp = timestamp ? new Date(timestamp) : new Date();
  const now = new Date();

  const existing = await ConversationRead.findOne({ senderId, receiverId })
    .select('messageId timestamp')
    .lean();

  if (existing?.messageId === messageId) return;

  if (existing?.timestamp && messageTimestamp <= existing.timestamp) return;

  await ConversationRead.findOneAndUpdate(
    { senderId, receiverId },
    { messageId, timestamp: messageTimestamp, lastSeenAt: now },
    { upsert: true, new: true }
  );

  unreadCacheClient.reset(receiverId, `private_${senderId}`).catch(() => {});
  lastReadCacheClient.setPrivate(receiverId, senderId, { messageId, lastSeenAt: now }).catch(() => {});

  publish('notification.lastread.private', {
    userId: receiverId,
    peerId: senderId,
    messageId,
    lastSeenAt: now.toISOString(),
  });

  getIO().to(String(senderId)).emit('readReceipt', {
    senderId,       
    receiverId,    
    messageId,
    timestamp: messageTimestamp,
    lastSeenAt: now,
  });
};

export default handleMarkRead;