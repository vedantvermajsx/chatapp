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
  loadNewerMessagesHandler,
  catchUpNewerMessagesHandler
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
  const [hasMoreNewerMessages, setHasMoreNewerMessages] = useState(false);
  const [hasMoreMembers, setHasMoreMembers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loadingNewerMessages, setLoadingNewerMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    dbService.loadUnreadCounts().then(saved => {
      if (saved && Object.keys(saved).length > 0) {
        setUnreadCounts(prev => ({ ...saved, ...prev }));
      }
    });
  }, []);

  useEffect(() => {
    dbService.saveUnreadCounts(unreadCounts);
  }, [unreadCounts]);

  const messageCache = useRef({});
  const roomMembersCache = useRef({});
  const loadingMoreMessages = useRef(false);
  const loadingNewerMessagesRef = useRef(false);
  const loadingMoreMembersRef = useRef(false);
  const currentSwitchId = useRef(0); 
  const CACHE_TTL = 30000;

  useEffect(() => {
    const handlePendingSent = (e) => {
      const { cacheKey, tempId, message } = e.detail || {};
      if (!cacheKey || !tempId || !message) return;

      const reconcile = (list) => {
        const withoutTemp = list.filter(m => (m.id || m._id) !== tempId);
        const alreadyHasFinal = withoutTemp.some(m => (m.id || m._id) === message.id);
        return alreadyHasFinal ? withoutTemp : [...withoutTemp, message];
      };

      if (messageCache.current[cacheKey]) {
        messageCache.current[cacheKey] = {
          ...messageCache.current[cacheKey],
          messages: reconcile(messageCache.current[cacheKey].messages)
        };
      }

      const activeKey = currentRoom?._id ? `room_${currentRoom._id}` : (currentPrivateChat?.id ? `private_${currentPrivateChat.id}` : null);
      if (activeKey === cacheKey) {
        setMessages(prev => reconcile(prev));
      }
    };

    window.addEventListener('pending-message-sent', handlePendingSent);
    return () => window.removeEventListener('pending-message-sent', handlePendingSent);
  }, [currentRoom?._id, currentPrivateChat?.id]);

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

  const loadRoomMembers = useCallback(async (search = '', forceRefresh = false) => {
    if (!currentRoom) return;

    const cacheKey = currentRoom._id;

    if (!search && !forceRefresh) {
      const cached = roomMembersCache.current[cacheKey];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setRoomMembers(prev => cached.members.map(m => {
          const live = (prev || []).find(p => String(p._id || p.id) === String(m._id || m.id));
          return live ? { ...m, isOnline: live.isOnline } : m;
        }));
        setHasMoreMembers(cached.hasMore);
        return;
      }
    }

    setLoadingRoomMembers(true);

    try {
      const res = await roomService.getRoomMembers(currentRoom._id, 0, search);
      const members = res?.members || [];
      const hasMore = res?.hasMore || false;
      setRoomMembers(members);
      setHasMoreMembers(hasMore);

      if (!search) {
        roomMembersCache.current[cacheKey] = {
          members,
          hasMore,
          timestamp: Date.now(),
        };
      }
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
      const newMembers = res?.members || [];
      const hasMore = res?.hasMore || false;
      setRoomMembers(prev => {
        const merged = [...prev, ...newMembers];
        if (!search) {
          roomMembersCache.current[currentRoom._id] = {
            members: merged,
            hasMore,
            timestamp: Date.now(),
          };
        }
        return merged;
      });
      setHasMoreMembers(hasMore);
    } catch (error) {
      toast.error('Failed to load more members');
    } finally {
      loadingMoreMembersRef.current = false;
    }
  }, [currentRoom, roomMembers.length, hasMoreMembers, setRoomMembers, setHasMoreMembers]);

  const sendMessage = useCallback(async (e, socket) => {
    e.preventDefault();

    if (!inputMessage && !selectedFile) return;

    if (hasMoreNewerMessages && messages.length > 0) {
      loadingNewerMessagesRef.current = true;
      setLoadingNewerMessages(true);
      try {
        if (currentPrivateChat) {
          await catchUpNewerMessagesHandler(
            currentPrivateChat.id,
            'private',
            messages,
            setMessages,
            setHasMoreNewerMessages,
            messageCache,
            setUnreadCounts
          );
        } else if (currentRoom) {
          await catchUpNewerMessagesHandler(
            currentRoom._id,
            'room',
            messages,
            setMessages,
            setHasMoreNewerMessages,
            messageCache,
            setUnreadCounts
          );
        }
      } finally {
        loadingNewerMessagesRef.current = false;
        setLoadingNewerMessages(false);
      }
    }

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
  }, [currentRoom, currentPrivateChat, user, inputMessage, privateChats, selectedFile, hasMoreNewerMessages, messages]);

  const sendSticker = useCallback(async (stickerEmoji) => {
    if (hasMoreNewerMessages && messages.length > 0) {
      loadingNewerMessagesRef.current = true;
      setLoadingNewerMessages(true);
      try {
        if (currentPrivateChat) {
          await catchUpNewerMessagesHandler(
            currentPrivateChat.id,
            'private',
            messages,
            setMessages,
            setHasMoreNewerMessages,
            messageCache,
            setUnreadCounts
          );
        } else if (currentRoom) {
          await catchUpNewerMessagesHandler(
            currentRoom._id,
            'room',
            messages,
            setMessages,
            setHasMoreNewerMessages,
            messageCache,
            setUnreadCounts
          );
        }
      } finally {
        loadingNewerMessagesRef.current = false;
        setLoadingNewerMessages(false);
      }
    }

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
  }, [currentRoom, currentPrivateChat, user, privateChats, hasMoreNewerMessages, messages]);

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
      (val) => { if (currentSwitchId.current === switchId) setHasMoreNewerMessages(val); },
      messageCache,
      CACHE_TTL,
      unreadCounts[`room_${roomId}`] || 0,
      setUnreadCounts
    );
    setShowSidebar(false);
  }, [joinedRooms, user, CACHE_TTL, setRoomMembers, currentRoom, clearUnread, setJoinedRooms, loadJoinedRooms]);

  const startPrivateChat = useCallback(async (otherUser, socket) => {
    const switchId = ++currentSwitchId.current;
    
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
      (val) => { if (currentSwitchId.current === switchId) setHasMoreNewerMessages(val); },
      messageCache,
      CACHE_TTL,
      unreadCounts[`private_${otherUser.id}`] || 0,
      setUnreadCounts
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
        messageCache,
        setUnreadCounts
      );
    } else if (currentRoom) {
      await loadMoreRoomMessagesHandler(
        currentRoom._id,
        messages,
        setMessages,
        setHasMoreMessages,
        loadingMoreMessages,
        messageCache,
        setUnreadCounts
      );
    }
  }, [currentPrivateChat, currentRoom, user, messages]);

  const loadNewerMessages = useCallback(async () => {
    if (loadingNewerMessagesRef.current || !hasMoreNewerMessages || messages.length === 0) return;
    loadingNewerMessagesRef.current = true;
    setLoadingNewerMessages(true);
    try {
      if (currentPrivateChat) {
        await loadNewerMessagesHandler(
          currentPrivateChat.id,
          'private',
          user,
          messages,
          setMessages,
          setHasMoreNewerMessages,
          messageCache,
          setUnreadCounts
        );
      } else if (currentRoom) {
        await loadNewerMessagesHandler(
          currentRoom._id,
          'room',
          user,
          messages,
          setMessages,
          setHasMoreNewerMessages,
          messageCache,
          setUnreadCounts
        );
      }
    } finally {
      loadingNewerMessagesRef.current = false;
      setLoadingNewerMessages(false);
    }
  }, [currentPrivateChat, currentRoom, user, messages, hasMoreNewerMessages]);

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
    hasMoreNewerMessages, setHasMoreNewerMessages,
    loadingNewerMessages,
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
    loadMoreMessages,
    loadNewerMessages
  };
};