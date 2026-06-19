import { onlineUsers } from '../socket.js';
import userCache from '../database/userCache.js';
import roomCache from '../database/roomCache.js';
import { publish } from '../utils/messageBroker.js';

export default function handleJoin(socket, io) {
  return async (data) => {
    const { userId, role, username, gender } = data;
    console.log('User joining:', username);


    socket.join(userId);
    
    try {
      const memberRooms = await roomCache.getRoomsByUserId(userId);
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

    await userCache.updateUserById(userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    io.emit('userOnline', { userId });
    publish('userOnline', { userId });
  };
}
