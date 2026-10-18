import UnreadCacheService from '../../services/UnreadCacheService.js';
import { getUserRoomIds } from './unread.helpers.js';

export const getUnread = async (req, res) => {
  const { userId } = req.params;
  try {
    const roomIds = await getUserRoomIds(userId);
    // Private: totalCount - readCount from the UnreadCount collection. Rooms: roomCount - readCount.
    const counts = await UnreadCacheService.getAllWithRooms(userId, roomIds);

    res.json({ cold: false, counts });
  } catch (err) {
    console.error('[unread.controller] getUnread error:', err);
    res.status(500).json({ error: err.message });
  }
};
