import messageService from '../services/message.service.js';
import { dbService } from '../services/indexedDB.service.js';

export const loadPrivateChatsHandler = async (setPrivateChats, setLoadingPrivateChats) => {
  setLoadingPrivateChats(true);
  try {
    const cachedChats = await dbService.getPrivateChats();
    if (cachedChats.length > 0) {
      setPrivateChats(cachedChats);
    }
    
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

export const startPrivateChatHandler = async (
  otherUser,
  user,
  setCurrentPrivateChat,
  setCurrentRoom,
  setShowMembersModal,
  setMessages,
  setLoadingMessages,
  setHasMoreMessages,
  messageCache,
  CACHE_TTL
) => {
  setCurrentPrivateChat(otherUser);
  setCurrentRoom(null);
  setShowMembersModal(false);

  const cacheKey = `private_${otherUser.id}`;
  const cachedData = messageCache.current[cacheKey];

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    setMessages(cachedData.messages);
    setHasMoreMessages(cachedData.hasMore);
    setLoadingMessages(false);
    return;
  }

  setMessages([]);
  setLoadingMessages(true);

  try {
    const res = await messageService.getPrivateMessages(otherUser.id, 20);

    messageCache.current[cacheKey] = {
      messages: res.messages,
      hasMore: res.hasMore,
      timestamp: Date.now()
    };

    setMessages(res.messages);
    setHasMoreMessages(res.hasMore);
    await dbService.saveMessages(cacheKey, res.messages, res.hasMore);
  } catch (error) {
    const idbData = await dbService.getMessages(cacheKey);
    if (idbData.messages.length > 0) {
      setMessages(idbData.messages);
      setHasMoreMessages(idbData.hasMore);
    }
    console.error('Failed to load private messages:', error);
  } finally {
    setLoadingMessages(false);
  }
};

export const loadMoreMessagesHandler = async (
  otherUser,
  user,
  messages,
  setMessages,
  setHasMoreMessages,
  setLoadingMoreMessages,
  messageCache
) => {
  if (!messages.length || setLoadingMoreMessages.current) return;

  setLoadingMoreMessages.current = true;

  try {
    const earliestTimestamp = messages[0].timestamp;
    const res = await messageService.getPrivateMessages(otherUser.id, 20, earliestTimestamp);

    setMessages(prev => [...res.messages, ...prev]);
    setHasMoreMessages(res.hasMore);

    const cacheKey = `private_${otherUser.id}`;
    if (messageCache.current[cacheKey]) {
      messageCache.current[cacheKey] = {
        ...messageCache.current[cacheKey],
        messages: [...res.messages, ...messageCache.current[cacheKey].messages],
        hasMore: res.hasMore
      };
    }
  } catch (error) {
    console.error('Failed to load more messages:', error);
  } finally {
    setLoadingMoreMessages.current = false;
  }
};

export const updatePrivateChatOptimistically = (
  privateChats,
  setPrivateChats,
  otherUser,
  messageContent
) => {
  setPrivateChats(prev => {
    const chatIndex = prev.findIndex(c => c.otherUser.id === otherUser.id);
    if (chatIndex !== -1) {
      const updatedChats = [...prev];
      const [existingChat] = updatedChats.splice(chatIndex, 1);
      return [
        {
          ...existingChat,
          otherUser: {
            ...existingChat.otherUser,
            ...otherUser 
          },
          lastMessage: {
            content: messageContent,
            timestamp: new Date()
          }
        },
        ...updatedChats
      ];
    } else {
      return [
        {
          otherUser,
          lastMessage: {
            content: messageContent,
            timestamp: new Date()
          }
        },
        ...prev
      ];
    }
  });
};
