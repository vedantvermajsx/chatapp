import Message from '../../models/message.model.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';

export const deletePrivateChat = async (req, res) => {
  try {
    const { user } = req;
    const { otherUserId } = req.params;
    const userId = user.id;

    if (!otherUserId) {
      return res.status(400).json({ message: 'otherUserId is required' });
    }

    await Message.updateMany(
      {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      { $addToSet: { deletedFor: userId } }
    );

    // Invalidate the cache for this private chat so the next fetch respects the deletedFor filter
    await messageCacheClient.invalidatePrivateMessages(userId, otherUserId);
    
    res.status(200).json({ message: 'Chat removed successfully' });
  } catch (error) {
    console.error('Error deleting private chat:', error);
    res.status(500).json({ message: 'Failed to delete chat', error: error.message });
  }
};
