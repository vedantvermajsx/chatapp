import { getIO } from '../../socket.js';
import { publish } from '../messageBroker.js';
import unreadCacheClient from '../../database/unreadCacheClient.js';
import messageCountCacheClient from '../../database/messageCountCacheClient.js';
import { sendPushToUser } from '../pushNotifications.js';

export async function handleNewPrivateMessage(data) {
  const { senderId, receiverId, payload } = data;
  const io = getIO();
  const senderStr = String(senderId);
  const receiverStr = String(receiverId);
  if (io) {
    io.to(receiverStr).emit('newPrivateMessage', payload);
    io.to(senderStr).emit('newPrivateMessage', payload);
    io.to(receiverStr).emit('unreadUpdate', { chatKey: `private_${senderStr}` });
  }
  publish('newPrivateMessage', { senderId: senderStr, receiverId: receiverStr, payload });
  if (!payload.isSystemMessage) {
    try {
      _warmCacheForPrivateMessage(senderId, receiverId);
    } catch (err) {
      console.error('[emitQueue] newPrivateMessage cache warm error:', err.message);
    }

    sendPushToUser(receiverStr, {
      title: payload.senderUsername || payload.username || 'Unknown',
      body: 'new  message',
      data: {
        type: 'private',
        senderId: senderStr,
        receiverId: receiverStr,
        messageId: payload._id || '',
      },
    }).catch((err) => console.error('[emitQueue] push newPrivateMessage error:', err.message));
  }
}

function _warmCacheForPrivateMessage(senderId, receiverId) {
  unreadCacheClient.incrementPrivate(receiverId, senderId).catch(err =>
    console.error('[emitQueue] incrementPrivate unread error:', err.message)
  );
  
  messageCountCacheClient.incrementPrivate(senderId, receiverId).catch(err =>
    console.error('[emitQueue] incrementPrivate count error:', err.message)
  );
  
  publish('notification.unread.private', { receiverId, senderId });
}
