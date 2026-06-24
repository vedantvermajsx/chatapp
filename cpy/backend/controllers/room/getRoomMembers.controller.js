import roomCacheClient from '../../database/roomCacheClient.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

export async function getRoomMembers(req, res) {
  try {
    const { roomId } = req.params;
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE)
    );
    const search = req.query.search || '';

    const page = await roomCacheClient.getRoomMembers(roomId, { skip, limit, search });

    if (page === null) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(page);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}