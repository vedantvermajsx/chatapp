import MessageCountCacheService from '../../services/MessageCountCacheService.js';

export const getPrivateCount = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const count = await MessageCountCacheService.getPrivateCount(senderId, receiverId);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
