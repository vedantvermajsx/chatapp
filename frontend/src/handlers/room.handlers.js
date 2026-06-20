import roomService from '../services/room.service.js';
import messageService from '../services/message.service.js';
import { dbService } from '../services/indexedDB.service.js';
import { toast } from 'sonner';

export const loadRoomsHandler = async (searchQuery, setRooms, setLoadingRooms) => {
  setLoadingRooms(true);
  try {
    const cachedRooms = await dbService.getRooms(searchQuery);
    if (cachedRooms.length > 0) {
      setRooms(cachedRooms);
    }
    
    const res = await roomService.getAllRooms(searchQuery);
    setRooms(res);
    await dbService.saveRooms(res, searchQuery);
  } catch (error) {
    const cachedRooms = await dbService.getRooms(searchQuery);
    if (cachedRooms.length > 0) {
      setRooms(cachedRooms);
    } else {
      toast.error('Failed to load rooms');
    }
  } finally {
    setLoadingRooms(false);
  }
};

export const joinRoomHandler = async (
  roomId,
  rooms,
  user,
  setCurrentRoom,
  setCurrentPrivateChat,
  setMessages,
  socket,
  setLoadingJoinRoom,
  setLoadingMessages,
  messageCache,
  CACHE_TTL,
  currentRoom
) => {
  if (currentRoom && currentRoom._id === roomId) return;

  setLoadingJoinRoom(true);
  try {
    const room = rooms.find(r => r._id === roomId);
    setCurrentRoom(room);
    setCurrentPrivateChat(null);
    
    const cacheKey = `room_${roomId}`;
    const cachedData = messageCache.current[cacheKey];
    
    if (!cachedData || Date.now() - cachedData.timestamp >= CACHE_TTL) {
      setMessages([]);
      setLoadingMessages(true);
    }
    
    await roomService.joinRoom(roomId);
    socket.emit('joinRoom', {
      roomId,
      userId: user.id,
      username: user.username
    });
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to join room');
  } finally {
    setLoadingJoinRoom(false);
  }
};

export const loadRoomMessagesHandler = async (
  roomId,
  user,
  setMessages,
  setLoadingMessages,
  setHasMoreMessages,
  messageCache,
  CACHE_TTL
) => {
  const cacheKey = `room_${roomId}`;
  const cachedData = messageCache.current[cacheKey];

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    setMessages(cachedData.messages);
    setHasMoreMessages(cachedData.hasMore);
    return;
  }

  const idbData = await dbService.getMessages(cacheKey);
  if (idbData.messages.length > 0) {
    setMessages(idbData.messages);
    setHasMoreMessages(idbData.hasMore);
    messageCache.current[cacheKey] = {
      messages: idbData.messages,
      hasMore: idbData.hasMore,
      timestamp: Date.now()
    };
  }

  setLoadingMessages(true);
  try {
    const res = await messageService.getRoomMessages(roomId, 20);

    messageCache.current[cacheKey] = {
      messages: res.messages,
      hasMore: res.hasMore,
      timestamp: Date.now()
    };

    setMessages(res.messages);
    setHasMoreMessages(res.hasMore);
    await dbService.saveMessages(cacheKey, res.messages, res.hasMore);
  } catch (error) {
    console.error('Failed to load room messages:', error);
  } finally {
    setLoadingMessages(false);
  }
};

export const loadMoreRoomMessagesHandler = async (
  roomId,
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
    const res = await messageService.getRoomMessages(roomId, 20, earliestTimestamp);

    setMessages(prev => [...res.messages, ...prev]);
    setHasMoreMessages(res.hasMore);

    const cacheKey = `room_${roomId}`;
    if (messageCache.current[cacheKey]) {
      messageCache.current[cacheKey] = {
        ...messageCache.current[cacheKey],
        messages: [...res.messages, ...messageCache.current[cacheKey].messages],
        hasMore: res.hasMore
      };
    }
  } catch (error) {
    console.error('Failed to load more room messages:', error);
  } finally {
    setLoadingMoreMessages.current = false;
  }
};
