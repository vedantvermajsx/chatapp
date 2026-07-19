import { activeRooms } from '../socket.js';
import unreadCacheClient from '../database/unreadCacheClient.js';
import lastReadCacheClient from '../database/lastReadCacheClient.js';
import { publish } from '../utils/messageBroker.js';

const handleMarkRoomRead = (socket) => async ({ roomId, messageId, timestamp }) => {
  if (!roomId) return;

  const userId = socket.user._id || socket.user.id;

  activeRooms.set(String(userId), String(roomId));

  try {
    const lastReadAt = timestamp ? new Date(timestamp) : new Date();

    publish('notification.lastread.room', {
      userId,
      roomId,
      messageId: messageId ?? null,
      lastReadAt: lastReadAt.toISOString(),
    });

    unreadCacheClient.reset(userId, `room_${roomId}`).catch(err => {
      console.error('[markRoomRead] unreadCache reset error:', err.message);
    });
    lastReadCacheClient.setRoom(userId, roomId, { messageId: messageId ?? null, lastReadAt }).catch(() => {});

    socket.emit('roomReadAck', { roomId });
  } catch (err) {
    console.error('[markRoomRead] error:', err);
  }
};

export default handleMarkRoomRead;
