import { useState, useCallback, useRef,useEffect } from 'react';
import {
  loadRoomsHandler,
  loadPrivateChatsHandler,
  sendMessageHandler,
  joinRoomHandler,
  startPrivateChatHandler,
  loadMoreMessagesHandler,
  loadRoomMessagesHandler,
  loadMoreRoomMessagesHandler
} from '../handlers/chat.handlers';
import roomService from '../services/room.service';
import userService from '../services/user.service';
import { toast } from 'sonner';

export const useChatState = (user) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentPrivateChat, setCurrentPrivateChat] = useState(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingPrivateChats, setLoadingPrivateChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingJoinRoom, setLoadingJoinRoom] = useState(false);
  const [loadingRoomMembers, setLoadingRoomMembers] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const messageCache = useRef({});
  const loadingMoreMessages = useRef(false);
  const loadingMoreMembersRef = useRef(false);
  const CACHE_TTL = 30000;

  const loadRooms = useCallback(async () => {
    await loadRoomsHandler(searchQuery, setRooms, setLoadingRooms);
  }, [searchQuery]);

  const loadPrivateChats = useCallback(async () => {
    await loadPrivateChatsHandler(setPrivateChats, setLoadingPrivateChats);
  }, []);

  const loadRoomMembers = useCallback(async (search = '') => {
    if (!currentRoom) return;
    
    setLoadingRoomMembers(true);
    
    try {
      const res = await roomService.getRoomMembers(currentRoom._id, 0, search);
      setRoomMembers(res?.members || []);
      setHasMoreMembers(res?.hasMore || false);
    } catch (error) {
      toast.error('Failed to load room members');
    } finally {
      setLoadingRoomMembers(false);
    }
  }, [currentRoom, setRoomMembers, setLoadingRoomMembers, setHasMoreMembers]);

  const loadMoreRoomMembers = useCallback(async (search = '') => {
    if (!currentRoom || loadingMoreMembersRef.current || !hasMoreMembers) return;
    
    loadingMoreMembersRef.current = true;
    
    try {
      const res = await roomService.getRoomMembers(currentRoom._id, roomMembers.length, search);
      setRoomMembers(prev => [...prev, ...(res?.members || [])]);
      setHasMoreMembers(res?.hasMore || false);
    } catch (error) {
      toast.error('Failed to load more members');
    } finally {
      loadingMoreMembersRef.current = false;
    }
  }, [currentRoom, roomMembers.length, hasMoreMembers, setRoomMembers, setHasMoreMembers]);

  const sendMessage = useCallback(async (e, socket) => {
    await sendMessageHandler(
      e,
      currentRoom,
      currentPrivateChat,
      user,
      inputMessage,
      setInputMessage,
      socket,
      setMessages,
      privateChats,
      setPrivateChats,
      messageCache,
      selectedFile,
      setSelectedFile
    );
  }, [currentRoom, currentPrivateChat, user, inputMessage, privateChats, selectedFile]);

  const joinRoom = useCallback(async (roomId, socket) => {
    await joinRoomHandler(
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
      currentRoom  // <-- guard: skip if already in this room
    );
    setRoomMembers([]);
    
    const cacheKey = `room_${roomId}`;
    const cachedData = messageCache.current[cacheKey];
    
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      setMessages(cachedData.messages);
      setHasMoreMessages(cachedData.hasMore);
    }
    
    await loadRoomMessagesHandler(
      roomId,
      user,
      setMessages,
      setLoadingMessages,
      setHasMoreMessages,
      messageCache,
      CACHE_TTL
    );
    setShowSidebar(false);
  }, [rooms, user, CACHE_TTL, setRoomMembers, currentRoom]);

  const startPrivateChat = useCallback(async (otherUser) => {
    await startPrivateChatHandler(
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
    );
    setShowSidebar(false);
  }, [user, CACHE_TTL]);

  const loadMoreMessages = useCallback(async () => {
    if (currentPrivateChat) {
      await loadMoreMessagesHandler(
        currentPrivateChat,
        user,
        messages,
        setMessages,
        setHasMoreMessages,
        loadingMoreMessages,
        messageCache
      );
    } else if (currentRoom) {
      await loadMoreRoomMessagesHandler(
        currentRoom._id,
        messages,
        setMessages,
        setHasMoreMessages,
        loadingMoreMessages,
        messageCache
      );
    }
  }, [currentPrivateChat, currentRoom, user, messages]);

  useEffect(() => {
    if (!currentPrivateChat) {
      return;
    }

    const fetchActivityStatus = async () => {
      try {
        const status = await userService.getActivityStatus(currentPrivateChat.id);
        if (status) {
          setCurrentPrivateChat(prev => ({
            ...prev,
            isOnline: status.isOnline,
            lastSeen: status.lastSeen
          }));
          setPrivateChats(prev => prev.map(chat =>
            chat.otherUser.id === currentPrivateChat.id
              ? {
                  ...chat,
                  otherUser: {
                    ...chat.otherUser,
                    isOnline: status.isOnline,
                    lastSeen: status.lastSeen
                  }
                }
              : chat
          ));
        }
      } catch (error) {
        console.error('Error fetching activity status:', error);
      }
    };

    fetchActivityStatus();
    const intervalId = setInterval(fetchActivityStatus, 3 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [currentPrivateChat?.id, setCurrentPrivateChat, setPrivateChats]);

  return {
    messages, setMessages,
    inputMessage, setInputMessage,
    selectedFile, setSelectedFile,
    rooms, setRooms,
    searchQuery, setSearchQuery,
    currentRoom, setCurrentRoom,
    currentPrivateChat, setCurrentPrivateChat,
    newRoomName, setNewRoomName,
    newRoomDesc, setNewRoomDesc,
    showCreateRoom, setShowCreateRoom,
    showMembersModal, setShowMembersModal,
    roomMembers, setRoomMembers,
    privateChats, setPrivateChats,
    loadingRooms,
    loadingPrivateChats,
    loadingMessages,
    loadingJoinRoom,
    loadingRoomMembers, setLoadingRoomMembers,
    hasMoreMessages,
    hasMoreMembers,
    showSidebar, setShowSidebar,
    messageCache,
    loadRooms,
    loadPrivateChats,
    loadRoomMembers,
    loadMoreRoomMembers,
    sendMessage,
    joinRoom,
    startPrivateChat,
    loadMoreMessages
  };
};
