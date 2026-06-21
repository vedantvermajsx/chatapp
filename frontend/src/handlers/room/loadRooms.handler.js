import roomService from '../../services/room.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { toast } from 'sonner';

export const loadRoomsHandler = async (searchQuery, setRooms, setLoadingRooms) => {
  setLoadingRooms(true);
  try {
    const cachedRooms = await dbService.getRooms(searchQuery);
    if (cachedRooms.length > 0) setRooms(cachedRooms);

    const res = await roomService.getAllRooms(searchQuery);
    setRooms(res);
    await dbService.saveRooms(res, searchQuery);
  } catch (error) {
    const cachedRooms = await dbService.getRooms(searchQuery);
    if (cachedRooms.length > 0) {
      setRooms(cachedRooms);
    } else {
      toast.error('Failed to load rooms');
    }
  } finally {
    setLoadingRooms(false);
  }
};
