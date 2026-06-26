import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';
import unreadCacheClient from '../database/unreadCacheClient.js';

export default async function emitNewPrivateMessage(senderId, receiverId, payload) {
  const io = getIO();
  if (io) {
    io.to(receiverId).emit('newPrivateMessage', payload);
    io.to(senderId).emit('newPrivateMessage', payload);
  }

  publish('newPrivateMessage', { senderId, receiverId, payload });

  // Increment unread for receiver only (sender sent it, they don't get a badge)
  // Fire-and-forget
  if (!payload.isSystemMessage) {
    unreadCacheClient.incrementPrivate(receiverId, senderId).catch(
      err => console.error('[newPrivateMessage.emitter] unread increment error:', err.message)
    );
  }
}
