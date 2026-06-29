import messageService from '../../services/message.service.js';
import { dbService } from '../../services/indexedDB.service.js';
import { applyLastRead } from '../../utils/applyLastRead.js';

export const loadNewerMessagesHandler = async (
  chatId,
  type,
  user,
  messages,
  setMessages,
  setHasMoreNewerMessages,
  messageCache
) => {
  if (!messages || messages.length === 0) return;

  const latestMessage = messages[messages.length - 1];
  const after = latestMessage.timestamp;

  const cacheKey = type === 'room' ? `room_${chatId}` : `private_${chatId}`;

  try {
    let res;
    let lastRead = null;
    
    if (type === 'room') {
      res = await messageService.getRoomMessages(chatId, 20, null, after);
    } else {
      res = await messageService.getPrivateMessages(chatId, 20, null, after);
      lastRead = res.lastRead ?? null;
    }

    if (!res.messages || res.messages.length === 0) {
      setHasMoreNewerMessages(res.hasMore || false);
      return;
    }

    const existingIds = new Set(messages.map(m => String(m.id || m._id)));
    const reallyNew = res.messages.filter(m => !existingIds.has(String(m.id || m._id)));

    if (reallyNew.length > 0) {
      let mergedMessages = [...messages, ...reallyNew];
      
      if (type === 'private' && lastRead) {
        mergedMessages = applyLastRead(mergedMessages, lastRead);
      }
      
      messageCache.current[cacheKey] = {
        messages: mergedMessages,
        hasMore: messageCache.current[cacheKey]?.hasMore || false,
        timestamp: Date.now(),
      };
      
      setMessages(mergedMessages);
      await dbService.mergeNewMessages(cacheKey, reallyNew);
    }

    setHasMoreNewerMessages(res.hasMore || false);
  } catch (error) {
    console.error('Failed to load newer messages:', error);
  }
};
