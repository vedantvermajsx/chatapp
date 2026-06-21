import { onlineUsers } from '../socket.js';
import userCacheClient from '../database/userCacheClient.js';
import roomCacheClient from '../database/roomCacheClient.js';
import { publish } from '../utils/messageBroker.js';

export default function handleJoin(socket, io) {
  return async (data) => {
    const { userId, role, username, gender } = data;
    console.log('User joining:', username);


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
