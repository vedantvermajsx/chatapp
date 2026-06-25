import userCacheClient from '../../database/userCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';

export const getPrivateChats = async (req, res) => {
  try {
    const { user } = req;
    const userId = user.id;

    const chats = await messageCacheClient.getPrivateChats(userId);

    const otherUserIds = chats.filter((chat) => chat._id).map((chat) => chat._id);

    const userDetailsMap = await userCacheClient.getUsersByIds(otherUserIds);

    const chatsWithUserInfo = chats
      .filter((chat) => chat._id)
      .map((chat) => {
        const lastMessage = chat.lastMessage;
        const otherUserId = lastMessage.senderId === userId
          ? lastMessage.receiverId
          : lastMessage.senderId;

        const otherUser = userDetailsMap.get(otherUserId) || {
          id: otherUserId,
          username: 'Deleted User',
          gender: null,
          role: 'user',
          avatar: null,
          isOnline: false,
          lastSeen: null
        };

        return {
          otherUser: {
            ...otherUser,
            isOnline: otherUser.isOnline,
            lastSeen: otherUser.lastSeen
          },
          lastMessage
        };
      });


    res.status(200).json(chatsWithUserInfo);
  } catch (error) {
    console.error('Error getting private chats:', error);
    res.status(500).json({ message: 'Failed to get chats', error: error.message });
  }
};
