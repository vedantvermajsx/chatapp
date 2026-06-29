import roomCacheService from '../../services/RoomCacheService.js';

export const addRoomMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const roomId = req.params.id;
    await roomCacheService.addRoomMember(roomId, userId);

    
    const roomDoc = await roomCacheService.getRoomById(roomId);
    const roomData = roomDoc ? await roomCacheService.addUserRoom(userId, roomId, roomDoc) : null;

    res.json({ ok: true, room: roomData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
