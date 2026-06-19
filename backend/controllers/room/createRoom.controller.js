import Room from '../../models/room.model.js';
import emitNewRoom from '../../emitters/newRoom.emitter.js';
import roomCache from '../../database/roomCache.js';

export async function createRoom(req, res) {
  try {
    const { groupName, groupDescription } = req.body;
    if (!groupName || !groupDescription) {
      return res.status(400).json({ message: 'Name and description required' });
    }

    const exists = await Room.findOne({ groupName });
    if (exists) {
      return res.status(409).json({ message: 'Room name already taken' });
    }

    const groupAdmin = req.user.id;
    const room = await Room.create({
      groupAdmin,
      groupName,
      groupDescription,
      groupMembers: [groupAdmin]
    });

    await roomCache.addRoomToCache(room._id.toString(), room);

    emitNewRoom(room);

    res.status(201).json({ message: 'Room created successfully', room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
