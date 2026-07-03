import roomCacheService from '../../services/RoomCacheService.js';

export const markRoomDeleted = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await roomCacheService.markRoomDeleted(id);
    if(result.success) {
      return res.status(200).json(result);
    }
    res.status(400).json({message:'could not delete room '});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
