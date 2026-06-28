import { useState, useCallback, useRef,useEffect } from 'react';
import {
  loadRoomsHandler,
  loadJoinedRoomsHandler,
  loadPrivateChatsHandler,
  sendMessageHandler,
  joinRoomHandler,
  startPrivateChatHandler,
  loadMoreMessagesHandler,
  loadRoomMessagesHandler,
  loadMoreRoomMessagesHandler,
  prefetchAllMessagesHandler
} from '../handlers/chat.handlers';
import { sendStickerHandler } from '../handlers/message/sendMessage.handler.js';
import roomService from '../services/room.service';
import userService from '../services/user.service';
import { toast } from 'sonner';
import { dbService } from '../services/indexedDB.service';

export const useChatState = (user) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [loadingJoinedRooms, setLoadingJoinedRooms] = useState(false);
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
  // unreadCounts: { 'room_{id}': number, 'private_{userId}': number }
  const [unreadCounts, setUnreadCounts] = useState({});

  // Load persisted unread counts from IndexedDB on mount
  useEffect(() => {
    dbService.loadUnreadCounts().then(saved => {
      if (saved && Object.keys(saved).length > 0) {
        setUnreadCounts(prev => ({ ...saved, ...prev }));
      }
    });
  }, []);

  // Persist unread counts to IndexedDB whenever they change
  useEffect(() => {
    dbService.saveUnreadCounts(unreadCounts);
  }, [unreadCounts]);

  const messageCache = useRef({});
  const loadingMoreMessages = useRef(false);
  const loadingMoreMembersRef = useRef(false);
  const currentSwitchId = useRef(0); 
  const CACHE_TTL = 30000;

  const clearUnread = useCallback((chatKey) => {
    setUnreadCounts(prev => {
      if (!prev[chatKey]) return prev;
      const next = { ...prev };
      delete next[chatKey];
      return next;
    });
  }, []);

  const loadRooms = useCallback(async () => {
    await loadRoomsHandler(searchQuery, setRooms, setLoadingRooms);
  }, [searchQuery]);

  const loadJoinedRooms = useCallback(async () => {
    const { joinedRooms } = await loadJoinedRoomsHandler(setJoinedRooms, setLoadingJoinedRooms, setUnreadCounts);
    return joinedRooms;
  }, []);

  const loadPrivateChats = useCallback(async () => {
    const { privateChats } = await loadPrivateChatsHandler(setPrivateChats, setLoadingPrivateChats);
    return privateChats;
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

  const sendSticker = useCallback(async (stickerEmoji) => {
    await sendStickerHandler(
      stickerEmoji,
      currentRoom,
      currentPrivateChat,
      user,
      setMessages,
      privateChats,
      setPrivateChats,
      messageCache
    );
  }, [currentRoom, currentPrivateChat, user, privateChats]);

  const joinRoom = useCallback(async (roomId, socket, roomObject = null) => {
    const switchId = ++currentSwitchId.current;

    await joinRoomHandler(
      roomId,
      joinedRooms,
      user,
      setCurrentRoom,
      setCurrentPrivateChat,
      setMessages,
      socket,
      setLoadingJoinRoom,
      setLoadingMessages,
      messageCache,
      CACHE_TTL,
      currentRoom,
      roomObject
    );
    setRoomMembers([]);
    clearUnread(`room_${roomId}`);

    // Tell the server this room is now read (updates RoomMessageRead)
    if (socket) {
      socket.emit('markRoomRead', { roomId });
    }

    // Add to joinedRooms if not already present
    setJoinedRooms(prev => {
      if (prev.some(r => r._id === roomId)) return prev;
      const room = joinedRooms.find(r => r._id === roomId) || (roomObject && roomObject._id === roomId ? roomObject : null);
      return room ? [...prev, room] : prev;
    });

    const cacheKey = `room_${roomId}`;
    const cachedData = messageCache.current[cacheKey];

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      if (currentSwitchId.current === switchId) {
        setMessages(cachedData.messages);
        setHasMoreMessages(cachedData.hasMore);
      }
    }

    await loadRoomMessagesHandler(
      roomId,
      user,
      (msgs) => { if (currentSwitchId.current === switchId) setMessages(msgs); },
      (val) => { if (currentSwitchId.current === switchId) setLoadingMessages(val); },
      (val) => { if (currentSwitchId.current === switchId) setHasMoreMessages(val); },
      messageCache,
      CACHE_TTL
    );
    setShowSidebar(false);
  }, [joinedRooms, user, CACHE_TTL, setRoomMembers, currentRoom, clearUnread, setJoinedRooms, loadJoinedRooms]);

  const startPrivateChat = useCallback(async (otherUser, socket) => {
    const switchId = ++currentSwitchId.current;
    clearUnread(`private_${otherUser.id}`);
    // Tell server the user is no longer actively viewing any room
    if (socket) socket.emit('clearActiveRoom');
    await startPrivateChatHandler(
      otherUser,
      user,
      setCurrentPrivateChat,
      setCurrentRoom,
      setShowMembersModal,
      (msgs) => { if (currentSwitchId.current === switchId) setMessages(msgs); },
      (val) => { if (currentSwitchId.current === switchId) setLoadingMessages(val); },
      (val) => { if (currentSwitchId.current === switchId) setHasMoreMessages(val); },
      messageCache,
      CACHE_TTL
    );
    setShowSidebar(false);
  }, [user, CACHE_TTL, clearUnread]);

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
    joinedRooms, setJoinedRooms,
    loadingJoinedRooms,
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
    unreadCounts, setUnreadCounts,
    messageCache,
    loadRooms,
    loadJoinedRooms,
    loadPrivateChats,
    loadRoomMembers,
    loadMoreRoomMembers,
    sendMessage,
    sendSticker,
    joinRoom,
    startPrivateChat,
    loadMoreMessages
  };
};