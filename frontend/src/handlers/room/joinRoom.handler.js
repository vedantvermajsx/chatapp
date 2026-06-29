import roomService from '../../services/room.service.js';
import { toast } from 'sonner';

export const joinRoomHandler = async (
  roomId,
  joinedRooms,
  user,
  setCurrentRoom,
  setCurrentPrivateChat,
  setMessages,
  socket,
  setLoadingJoinRoom,
  setLoadingMessages,
  messageCache,
  CACHE_TTL,
  currentRoom,
  roomObject = null
) => {
  if (currentRoom && currentRoom._id === roomId) return;

  setLoadingJoinRoom(true);
  try {
    
    let room = roomObject || joinedRooms.find(r => r._id === roomId) || null;
    if (room) setCurrentRoom(room);

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
      userId: user._id || user.id,
      username: user.username,
    };

    const res = await roomService.joinRoom(roomId, data);

    
    
    if (!room) {
      const serverRoom = res?.room || res?.data?.room || null;
      if (serverRoom) {
        setCurrentRoom(serverRoom);
        room = serverRoom;
      }
    }

    socket.emit('joinRoom', data);
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to join room');
  } finally {
    setLoadingJoinRoom(false);
  }
};