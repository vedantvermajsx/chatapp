import roomCacheService from '../../services/RoomCacheService.js';

export const addRoom = async (req, res) => {
  try {
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(400).json({ error: 'id and data are required' });
    }
    
    await roomCacheService.addRoomToCache(id, data);
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
