import UnreadCacheService from '../../services/UnreadCacheService.js';
import { getUserRoomIds, computePrivateFromDB } from './unread.helpers.js';

export const getUnread = async (req, res) => {
  const { userId } = req.params;
  try {
    let privateCached = UnreadCacheService.getAll(userId);
    if (privateCached === null) {
      privateCached = await computePrivateFromDB(userId);
      UnreadCacheService.seed(userId, privateCached);
    }

    const roomIds = await getUserRoomIds(userId);
    const counts = await UnreadCacheService.getAllWithRooms(userId, roomIds);

    res.json({ cold: false, counts });
  } catch (err) {
    console.error('[unread.controller] getUnread error:', err);
    res.status(500).json({ error: err.message });
  }
};
