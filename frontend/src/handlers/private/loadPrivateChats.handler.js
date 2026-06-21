import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';

export const loadPrivateChatsHandler = async (setPrivateChats, setLoadingPrivateChats) => {
  setLoadingPrivateChats(true);
  try {
    const cachedChats = await dbService.getPrivateChats();
    if (cachedChats.length > 0) setPrivateChats(cachedChats);

    const res = await messageService.getPrivateChats();
    setPrivateChats(res);
    await dbService.savePrivateChats(res);
  } catch (error) {
    const cachedChats = await dbService.getPrivateChats();
    if (cachedChats.length > 0) {
      setPrivateChats(cachedChats);
    }
    console.error('Failed to load private chats:', error);
  } finally {
    setLoadingPrivateChats(false);
  }
};
