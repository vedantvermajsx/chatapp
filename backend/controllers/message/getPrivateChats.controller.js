import userCacheClient from '../../database/userCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';
import { _addQualities } from '../../utils/addQualities.js';

function deletedUserFallback(otherUserId) {
  return {
    id: otherUserId,
    username: 'Deleted User',
    gender: null,
    avatar: getDefaultAvatar(0),
    isOnline: false,
    lastSeen: 0,
  };
}

export const getPrivateChats = async (req, res) => {
  try {
    const { user } = req;
    const userId = user._id;

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

        const rawOtherUser = userDetailsMap.get(otherUserId) || deletedUserFallback(otherUserId);

        // Only what the chat list UI actually needs — never forward the raw
        // cached user/guest document (it carries the password hash, age,
        // timestamps, __v, etc.)
        const otherUser = {
          id: String(rawOtherUser._id || rawOtherUser.id || otherUserId),
          username: rawOtherUser.username,
          avatar: rawOtherUser.avatar,
          gender: rawOtherUser.gender,
          isOnline: rawOtherUser.isOnline,
          lastSeen: rawOtherUser.lastSeen,
        };

        return {
          otherUser,
          lastMessage: {
            id: String(lastMessage._id || lastMessage.id),
            senderId: lastMessage.senderId,
            receiverId: lastMessage.receiverId,
            content: lastMessage.content,
            isSystemMessage: lastMessage.isSystemMessage,
            systemType: lastMessage.systemType,
            media: lastMessage.media ? _addQualities(lastMessage.media) : null,
            timestamp: lastMessage.timestamp,
          },
        };
      });


    res.status(200).json(chatsWithUserInfo);
  } catch (error) {
    console.error('Error getting private chats:', error);
    res.status(500).json({ message: 'Failed to get chats', error: error.message });
  }
};