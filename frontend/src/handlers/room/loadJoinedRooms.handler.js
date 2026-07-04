import roomService from '../../services/room.service.js';
import { dbService } from '../../services/indexedDB.service.js';

export const loadJoinedRoomsHandler = async (
  setJoinedRooms,
  setLoadingJoinedRooms,
  setUnreadCounts,
  socket
) => {
  let hasMore=true;

  if(!hasMore){
    return;
  }

  const subscribeAll = (rooms) => {
    if (!socket || !Array.isArray(rooms)) return;
    rooms.forEach(r => {
      const roomId = r._id || r.id;
      if (roomId) socket.emit('joinRoom', { roomId });
    });
  };

  setLoadingJoinedRooms(true);
  let joinedRooms = [];
  try {

    const cached = await dbService.getCachedJoinedRooms();
    if (cached.length > 0) {
      setJoinedRooms(cached);
      joinedRooms = cached;
      subscribeAll(cached);
    }

    const [roomData, unreadRes] = await Promise.all([
      roomService.getJoinedRooms(),
      roomService.getUnreadCounts()
    ]);

    joinedRooms = Array.isArray(roomData.data) ? roomData.data : roomData?.rooms ?? [];
    hasMore=roomData.hasMore;
    setJoinedRooms(joinedRooms);
    await dbService.saveJoinedRooms(joinedRooms);
    subscribeAll(joinedRooms);

    if (unreadRes && typeof unreadRes === 'object') {
      setUnreadCounts(prev => ({ ...prev, ...unreadRes }));
    }
  } catch (error) {
   const cached = await dbService.getCachedJoinedRooms();
    if (cached.length > 0) {
      setJoinedRooms(cached);
      joinedRooms = cached;
      subscribeAll(cached);
    }
    console.error('Failed to load joined rooms:', error);
  } finally {
    setLoadingJoinedRooms(false);
  }

  return { joinedRooms };
};