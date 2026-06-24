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

    await roomService.joinRoom(roomId);
    socket.emit('joinRoom', { roomId, userId: user.id, username: user.username });
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to join room');
  } finally {
    setLoadingJoinRoom(false);
  }
};
