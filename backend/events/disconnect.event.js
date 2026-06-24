import { onlineUsers, userRooms } from '../socket.js';
import userCacheClient from '../database/userCacheClient.js';
import { publish } from '../utils/messageBroker.js';

const disconnectTimers = new Map();
const GRACE_MS = 30*1000;

export default function handleDisconnect(socket, io) {
  return async () => {
    console.log('Client disconnected:', socket.id);

    let disconnectedUserId = null;
    for (const [userId, userData] of onlineUsers.entries()) {
      if (userData.socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (!disconnectedUserId) {
      const rooms = userRooms.get(socket.id);
      if (rooms) userRooms.delete(socket.id);
      return;
    }

    const timer = setTimeout(async () => {
      const current = onlineUsers.get(disconnectedUserId);
      if (current && current.socketId === socket.id) {
        onlineUsers.delete(disconnectedUserId);
        await userCacheClient.updateUserById(disconnectedUserId, {
          isOnline: false,
          lastSeen: new Date()
        });
        io.emit('userOffline', { userId: disconnectedUserId });
        publish('userOffline', { userId: disconnectedUserId });
      }
      disconnectTimers.delete(disconnectedUserId);
      const rooms = userRooms.get(socket.id);
      if (rooms) userRooms.delete(socket.id);
    }, GRACE_MS);

    disconnectTimers.set(disconnectedUserId, timer);
  };
}

export { disconnectTimers };