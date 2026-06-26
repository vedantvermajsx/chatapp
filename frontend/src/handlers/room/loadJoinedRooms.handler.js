import roomService from '../../services/room.service.js';
import { dbService } from '../../services/indexedDB.service.js';

export const loadJoinedRoomsHandler = async (
  setJoinedRooms,
  setLoadingJoinedRooms,
  setUnreadCounts
) => {
  let hasMore=true;

  if(!hasMore){
    return;
  }

  setLoadingJoinedRooms(true);
  let joinedRooms = [];
  try {

    const cached = await dbService.getCachedJoinedRooms();
    if (cached.length > 0) {
      setJoinedRooms(cached);
      joinedRooms = cached;
    }

    const [roomData, unreadRes] = await Promise.all([
      roomService.getJoinedRooms(),
      roomService.getUnreadCounts()
    ]);

    joinedRooms = Array.isArray(roomData.data) ? roomData.data : roomData?.rooms ?? [];
    hasMore=roomData.hasMore;
    setJoinedRooms(joinedRooms);
    await dbService.saveJoinedRooms(joinedRooms);

    if (unreadRes && typeof unreadRes === 'object') {
      setUnreadCounts(prev => ({ ...prev, ...unreadRes }));
    }
  } catch (error) {
   const cached = await dbService.getCachedJoinedRooms();
    if (cached.length > 0) {
      setJoinedRooms(cached);
      joinedRooms = cached;
    }
    console.error('Failed to load joined rooms:', error);
  } finally {
    setLoadingJoinedRooms(false);
  }

  return { joinedRooms };
};
