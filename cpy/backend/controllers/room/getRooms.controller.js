import roomCacheClient from '../../database/roomCacheClient.js';

export async function getRooms(req, res) {
  try {
    const { search = '' } = req.query;
    const rooms = await roomCacheClient.getAllRooms(search);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
