import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';

export const loadPrivateChatsHandler = async (setPrivateChats, setLoadingPrivateChats) => {
  setLoadingPrivateChats(true);
  let privateChats = [];
  try {
    const cachedChats = await dbService.getPrivateChats();
    if (cachedChats.length > 0) {
      setPrivateChats(cachedChats);
      privateChats = cachedChats;
    }

    const raw = await messageService.getPrivateChats();
    const res = raw.map(chat => ({
      ...chat,
      otherUser: {
        ...chat.otherUser,
        id: chat.otherUser.id || chat.otherUser._id,
      }
    }));
    privateChats = res;
    setPrivateChats(res);
    await dbService.savePrivateChats(res);
  } catch (error) {
    const cachedChats = await dbService.getPrivateChats();
    if (cachedChats.length > 0) {
      setPrivateChats(cachedChats);
      privateChats = cachedChats;
    }
    console.error('Failed to load private chats:', error);
  } finally {
    setLoadingPrivateChats(false);
  }
  return { privateChats };
};
