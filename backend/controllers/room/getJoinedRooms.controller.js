import roomCacheClient from '../../database/roomCacheClient.js';

export async function getJoinedRooms(req, res) {
  try {
    const userId = req.user._id;

    const cached = await roomCacheClient.getJoinedRooms(userId);
    if (cached) {
      return res.json(cached);
    }

    return res.json({ data: [], hasMore: false });
  } catch (err) {
    console.error('[getJoinedRooms] error:', err);
    res.status(500).json({ message: err.message });
  }
}
