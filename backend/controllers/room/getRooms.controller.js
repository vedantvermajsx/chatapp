import roomCacheClient from '../../database/roomCacheClient.js';

/**
 * GET /rooms
 * Query params:
 *   search  - filter by name (default '')
 *   skip    - offset for pagination (default 0)
 *   limit   - page size (default 20, max 50)
 */
export async function getRooms(req, res) {
  try {
    const { search = '' } = req.query;
    const skip = Math.max(0, parseInt(req.query.skip) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const { rooms, total } = await roomCacheClient.getAllRooms(search, { skip, limit });

    return res.json({
      rooms,
      total,
      skip,
      limit,
      hasMore: skip + rooms.length < total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
