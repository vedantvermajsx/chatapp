import roomService from '../../services/room.service.js';
import { toast } from 'sonner';

export const joinRoomHandler = async (
  roomId,
  rooms,
  user,
  setCurrentRoom,
  setCurrentPrivateChat,
  setMessages,
  socket,
  setLoadingJoinRoom,
  setLoadingMessages,
  messageCache,
  CACHE_TTL,
  currentRoom
) => {
  if (currentRoom && currentRoom._id === roomId) return;

  setLoadingJoinRoom(true);
  try {
    const room = rooms.find(r => r._id === roomId);
    setCurrentRoom(room);
    setCurrentPrivateChat(null);

    const cacheKey = `room_${roomId}`;
    const inMemory = messageCache.current[cacheKey];
    if (!inMemory?.messages?.length) {
      setMessages([]);
      setLoadingMessages(true);
    }

    const data = {
      roomId,
      message: `${user.username} joined the room`,
      media: null,
      isSystemMessage: true,
      systemType: 'member-joined',
      userId: user.id,
      username: user.username,
    }

    await roomService.joinRoom(roomId, data);
    socket.emit('joinRoom', data);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to join room');
  } finally {
    setLoadingJoinRoom(false);
  }
};
