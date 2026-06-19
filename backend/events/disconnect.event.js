import { onlineUsers, userRooms } from '../socket.js';
import userCache from '../database/userCache.js';
import { publish } from '../utils/messageBroker.js';

export default function handleDisconnect(socket, io) {
  return async () => {
    console.log('Client disconnected:', socket.id);
    let disconnectedUserId = null;
    for (const [userId, userData] of onlineUsers.entries()) {
      if (userData.socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      await userCache.updateUserById(disconnectedUserId, {
        isOnline: false,
        lastSeen: new Date()
      });
      io.emit('userOffline', { userId: disconnectedUserId });
      publish('userOffline', { userId: disconnectedUserId });
    }

    const rooms = userRooms.get(socket.id);
    if (rooms) {
      userRooms.delete(socket.id);
    }
  };
}
