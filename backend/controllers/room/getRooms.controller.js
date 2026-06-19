import Room from '../../models/room.model.js';

export async function getRooms(req, res) {
  try {
    const { search = '' } = req.query;
    const query = search
      ? { groupName: { $regex: search, $options: 'i' } }
      : {};
    const rooms = await Room.find(query).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
