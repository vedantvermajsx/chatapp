import roomService from '../../services/room.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { mergeByKey } from '../../utils/mergeCollections.js';

const roomKey = (room) => room?._id ?? room?.id;

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

  const cached = await dbService.getCachedJoinedRooms();
  if (cached.length > 0) {
    setJoinedRooms(prev => mergeByKey(prev, cached, roomKey));
    subscribeAll(cached);
  } else {
    setLoadingJoinedRooms(true);
  }

  let joinedRooms = cached;

  try {
    const [roomData, unreadRes] = await Promise.all([
      roomService.getJoinedRooms(),
      roomService.getUnreadCounts()
    ]);

    const fetched = Array.isArray(roomData.data) ? roomData.data : roomData?.rooms ?? [];
    hasMore = roomData.hasMore;

    setJoinedRooms(prev => mergeByKey(prev, fetched, roomKey));
    joinedRooms = mergeByKey(cached, fetched, roomKey);
    await dbService.saveJoinedRooms(fetched);
    subscribeAll(fetched);

    if (unreadRes && typeof unreadRes === 'object') {
      setUnreadCounts(prev => ({ ...prev, ...unreadRes }));
    }
  } catch (error) {
    if (cached.length === 0) {
      const fallback = await dbService.getCachedJoinedRooms();
      if (fallback.length > 0) {
        setJoinedRooms(prev => mergeByKey(prev, fallback, roomKey));
        joinedRooms = fallback;
        subscribeAll(fallback);
      }
    }
    console.error('Failed to load joined rooms:', error);
  } finally {
    setLoadingJoinedRooms(false);
  }

  return { joinedRooms };
};
