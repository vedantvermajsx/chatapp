import roomCache from '../../database/roomCache.js';

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

    const page = await roomCache.getRoomMembers(roomId, { skip, limit });

    if (page === null) {
      return res.status(404).json({ message: 'Room not found' });
    }


    res.json(page.members);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}