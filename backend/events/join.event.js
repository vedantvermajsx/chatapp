import { onlineUsers } from '../socket.js';
import { disconnectTimers } from './disconnect.event.js';
import userCacheClient from '../database/userCacheClient.js';
import roomCacheClient from '../database/roomCacheClient.js';
import { publish } from '../utils/messageBroker.js';

export default function handleJoin(socket, io) {
  return async (data) => {
    const { role, username, gender } = data;
    const userId = String(data.userId);
    console.log('User joining:', username);


    const pendingTimer = disconnectTimers.get(userId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      disconnectTimers.delete(userId);
    }

    socket.join(String(userId));
    
    try {
      const memberRooms = await roomCacheClient.getRoomsByUserId(userId);
      for (const room of memberRooms) {
        socket.join(String(room._id));
      }
      if (memberRooms.length > 0) {
        console.log(`[socket] ${username} auto-rejoined ${memberRooms.length} room(s)`);
      }
    } catch (err) {
      console.error('[socket] failed to auto-rejoin rooms for', username, err.message);
    }

    onlineUsers.set(userId, {
      socketId: socket.id,
      userId,
      role,
      username,
      gender
    });

    await userCacheClient.updateUserById(userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    io.emit('userOnline', { userId });
    publish('userOnline', { userId });
  };
}