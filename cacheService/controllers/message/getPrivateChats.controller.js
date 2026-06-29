import { getPrivateChats as getPrivateChatsService } from '../../services/MessageCacheService.js';

export const getPrivateChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await getPrivateChatsService(userId);
    res.json({ chats });
  } catch (error) {
    console.error('[CacheService] error getting private chats:', error);
    res.status(500).json({ message: 'Failed to get private chats', error: error.message });
  }
};

