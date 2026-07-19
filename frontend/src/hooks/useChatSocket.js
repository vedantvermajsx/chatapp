import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { updatePrivateChatOptimistically, catchUpNewerMessagesHandler } from '../handlers/chat.handlers.js';
import { dbService } from '../services/indexedDB.service.js';

export const useChatSocket = (user, {
  currentRoom,
  currentPrivateChat,
  setCurrentPrivateChat,
  privateChats,
  setPrivateChats,
  setMessages,
  loadRooms,
  loadJoinedRooms,
  loadPrivateChats,
  messageCache,
  roomMembers,
  setRoomMembers,
  loadRoomMembers,
  setUnreadCounts,
  setJoinedRooms,
  setCurrentRoom,
  setHasMoreNewerMessages
}) => {
  const socketRef = useRef(null);
  const userRef = useRef(user);
  const currentRoomRef = useRef(currentRoom);
  const currentPrivateChatRef = useRef(currentPrivateChat);
  const privateChatsRef = useRef(privateChats);
  const messageCacheRef = useRef(messageCache);
  const roomMembersRef = useRef(roomMembers);
  const loadRoomsRef = useRef(loadRooms);
  const loadJoinedRoomsRef = useRef(loadJoinedRooms);
  const loadPrivateChatsRef = useRef(loadPrivateChats);

  
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { currentPrivateChatRef.current = currentPrivateChat; }, [currentPrivateChat]);
  useEffect(() => { privateChatsRef.current = privateChats; }, [privateChats]);
  useEffect(() => { messageCacheRef.current = messageCache; }, [messageCache]);
  useEffect(() => { roomMembersRef.current = roomMembers; }, [roomMembers]);
  useEffect(() => { loadRoomsRef.current = loadRooms; }, [loadRooms]);
  useEffect(() => { loadJoinedRoomsRef.current = loadJoinedRooms; }, [loadJoinedRooms]);
  useEffect(() => { loadPrivateChatsRef.current = loadPrivateChats; }, [loadPrivateChats]);


  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }
    const token = localStorage.getItem('token');
    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_LOAD_BALENCER_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        perMessageDeflate: true,
        reconnection: true,
        reconnectionAttempts: 1000,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
        auth: {
          token: token
        }
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user?._id || user?.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const socket = socketRef.current;
      if (!socket) return;

      if (document.visibilityState === 'visible' && !socket.connected) {
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    const handleConnect = async () => {
      const currentUser = userRef.current;
      if (currentUser) {
        socket.emit('join', {
          userId: currentUser._id || currentUser.id,
          role: currentUser.role,
          username: currentUser.username,
          gender: currentUser.gender
        });
      }
      loadJoinedRoomsRef.current?.(socket);
      
      // Catch up on newer messages for all cached chats
      const cache = messageCacheRef.current;
      for (const [cacheKey, data] of Object.entries(cache)) {
        if (!data.messages || data.messages.length === 0) continue;
        
        if (cacheKey.startsWith('room_')) {
          const roomId = cacheKey.replace('room_', '');
          await catchUpNewerMessagesHandler(
            roomId,
            'room',
            data.messages,
            // If this is the current active room, update the messages state
            currentRoomRef.current?._id === roomId ? setMessages : () => {},
            setHasMoreNewerMessages,
            messageCacheRef,
            setUnreadCounts
          );
        } else if (cacheKey.startsWith('private_')) {
          const otherUserId = cacheKey.replace('private_', '');
          await catchUpNewerMessagesHandler(
            otherUserId,
            'private',
            data.messages,
            // If this is the current active chat, update the messages state
            currentPrivateChatRef.current?.id === otherUserId ? setMessages : () => {},
            setHasMoreNewerMessages,
            messageCacheRef,
            setUnreadCounts
          );
        }
      }
    };

    const handleNewMessage = async (msg) => {
      const currentUser = userRef.current;
      const messageCache = messageCacheRef.current;

      const isOwnMessage = msg.userId === (currentUser?._id || currentUser?.id);
      
      const isActiveRoom = String(currentRoomRef.current?._id) === String(msg.roomId);

      const newMessage = {
        id: msg?._id || msg?.id,
        username: msg?.username,
        text: msg?.text,
        isOwn: isOwnMessage,
        timestamp: msg?.timestamp || new Date().toISOString(),
        gender: msg?.gender,
        avatar: msg?.avatar || null,
        isOnline: msg?.isOnline,
        lastSeen: msg?.lastSeen,
        media: msg?.media || null,
        isPending: false,
        taggedUser: msg?.taggedUser || null,
        ...(msg?.isSystemMessage && {
          isSystemMessage: true,
          systemType: msg.systemType || null,
        }),
      };

      if (isActiveRoom) {
        setMessages((prev) => {
          if ((msg._id || msg.id)  && prev.some(m => String(m.id) === String(msg._id  || msg.id))) return prev;
          const existingOptimisticIndex = prev.findIndex(m =>
            m.isOwn && m.isPending && m.text === newMessage.text && (!!m.media === !!newMessage.media)
          );
          if (isOwnMessage && existingOptimisticIndex !== -1) {
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = newMessage;
            return newMessages;
          }
          if ((msg._id || msg.id) && prev.some(m => m.id === (msg._id || msg.id))) return prev;
          return [...prev, newMessage];
        });
      }

      const cacheKey = `room_${msg.roomId}`;
      if (messageCache.current[cacheKey]) {
        const prevMessages = messageCache.current[cacheKey].messages;
        const existingOptimisticIndex = prevMessages.findIndex(m =>
          m.isOwn && m.isPending && m.text === newMessage.text && (!!m.media === !!newMessage.media)
        );

        const alreadyInCache = prevMessages.some((m) => String(m.id) === String(newMessage.id));
        let newCacheMessages;
        if (!alreadyInCache) {
          if (isOwnMessage && existingOptimisticIndex !== -1) {
            newCacheMessages = [...prevMessages];
            newCacheMessages[existingOptimisticIndex] = newMessage;
          } else {
            newCacheMessages = [...prevMessages, newMessage];
          }
        }

        if (newCacheMessages && newCacheMessages !== prevMessages) {
          messageCache.current[cacheKey] = {
            ...messageCache.current[cacheKey],
            messages: newCacheMessages
          };
        }
      }

      await dbService.addMessage(cacheKey, newMessage);

      
      if (isActiveRoom) {
        socket.emit('markRoomRead', {
          roomId: msg.roomId,
          messageId: newMessage.id,
          timestamp: newMessage.timestamp
        });
      }

      
      if (!isOwnMessage && !isActiveRoom && !msg.isSystemMessage) {
        setUnreadCounts(prev => ({ ...prev, [cacheKey]: (prev[cacheKey] || 0) + 1 }));
      }
    };

    const handleNewPrivateMessage = async (msg) => {
      const currentUser = userRef.current;
      const currentPrivateChat = currentPrivateChatRef.current;
      const privateChats = privateChatsRef.current;
      const messageCache = messageCacheRef.current;

      const currentUserId = currentUser?._id || currentUser?.id;
      const otherUserId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      const isOwnMessage = msg.senderId === (currentUser?._id || currentUser?.id);

      let otherUser = privateChats.find(c => c.otherUser.id === otherUserId)?.otherUser;
      if (!otherUser) {
        otherUser = {
          id: otherUserId,
          username: msg.senderUsername || msg.username || 'Unknown',
          role: (msg.senderModel?.toLowerCase() || 'user'),
          avatar: msg.avatar || null,
          isOnline: msg.isOnline,
          lastSeen: msg.lastSeen
        };
      }

      updatePrivateChatOptimistically(privateChats, setPrivateChats, otherUser, msg.content);

      const cacheKey = `private_${otherUserId}`;
      const newMessageObj = {
        id: msg._id || msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        username: msg.senderUsername || msg.username,
        text: msg.content,
        isOwn: isOwnMessage,
        timestamp: msg.timestamp || new Date().toISOString(),
        gender: msg.gender,
        avatar: msg.avatar || null,
        isOnline: msg.isOnline,
        lastSeen: msg.lastSeen,
        media: msg.media || null,
        isPending: false,
        taggedUser: msg?.taggedUser || null,
        ...(msg?.isSystemMessage && {
          isSystemMessage: true,
          systemType: msg.systemType || null,
        }),
      };

      if (messageCache.current[cacheKey]) {
        const prevMessages = messageCache.current[cacheKey].messages;
        const existingOptimisticIndex = prevMessages.findIndex(m =>
          m.isOwn && m.isPending && m.text === newMessageObj.text && (!!m.media === !!newMessageObj.media)
        );

        let newCacheMessages;
        if (isOwnMessage && existingOptimisticIndex !== -1) {
          newCacheMessages = [...prevMessages];
          newCacheMessages[existingOptimisticIndex] = newMessageObj;
        } else {
          const already = prevMessages.some((m) => String(m.id) === String(newMessageObj.id));
          newCacheMessages = already ? prevMessages : [...prevMessages, newMessageObj];
        }

        if (newCacheMessages !== prevMessages) {
          messageCache.current[cacheKey] = {
            ...messageCache.current[cacheKey],
            messages: newCacheMessages
          };
        }
      } else {
        messageCache.current[cacheKey] = {
          messages: [newMessageObj],
          hasMore: false,
          timestamp: Date.now()
        };
      }

      
      const isActiveChat = currentPrivateChatRef.current?.id === otherUserId;

      if (isActiveChat) {
        setMessages((prev) => {
          if (msg._id && prev.some(m => String(m.id) === String(msg._id))) return prev;
          const existingOptimisticIndex = newMessageObj.isSystemMessage ? -1 : prev.findIndex(m =>
            m.isOwn && m.isPending && m.text === newMessageObj.text && (!!m.media === !!newMessageObj.media)
          );
          if (isOwnMessage && existingOptimisticIndex !== -1) {
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = newMessageObj;
            return newMessages;
          }
          if ((msg._id || msg.id) && prev.some(m => m.id === (msg._id || msg.id))) return prev;
          return [...prev, newMessageObj];
        });

        if (!isOwnMessage && !newMessageObj.isSystemMessage) {
          socket.emit('markRead', {
            senderId: msg.senderId,
            receiverId: currentUserId,
            messageId: newMessageObj.id,
            timestamp: newMessageObj.timestamp
          });
        }
      }
      
      await dbService.addMessage(cacheKey, newMessageObj);

    };

    const handleReadReceipt = async ({ senderId, receiverId, messageId, lastSeenAt }) => {
      const currentPrivateChat = currentPrivateChatRef.current;
      const messageCache = messageCacheRef.current;
      const cacheKey = `private_${receiverId}`;

      if (messageCache.current[cacheKey]) {
        const prevMessages = messageCache.current[cacheKey].messages;
        const updatedMessages = prevMessages.map(msg => {
          if (!msg.isOwn || msg.isSystemMessage) return msg;
          if ((msg.id || msg._id) === messageId) return { ...msg, isSeen: true, seenAt: lastSeenAt };
          if (msg.isSeen) return { ...msg, isSeen: false, seenAt: null };
          return msg;
        });
        const changed = updatedMessages.filter((msg, i) => msg !== prevMessages[i]);
        if (changed.length) {
          messageCache.current[cacheKey] = {
            ...messageCache.current[cacheKey],
            messages: updatedMessages,
          };
          changed.forEach(msg => dbService.addMessage(cacheKey, msg));
        }
      }

      const isActiveChat = currentPrivateChat && String(currentPrivateChat.id) === String(receiverId);
      if (!isActiveChat) return;

      setMessages(prev => {
        const updated = prev.map(msg => {
          if (!msg.isOwn || msg.isSystemMessage) return msg;
          if ((msg.id || msg._id) === messageId) return { ...msg, isSeen: true, seenAt: lastSeenAt };
          if (msg.isSeen) return { ...msg, isSeen: false, seenAt: null };
          return msg;
        });

        const changed = updated.filter((msg, i) => msg !== prev[i]);
        if (changed.length) {
          changed.forEach(msg => dbService.addMessage(cacheKey, msg));
        }

        return updated;
      });
    };

    const handleNewRoom = () => { loadRoomsRef.current?.(); if (loadJoinedRoomsRef.current) loadJoinedRoomsRef.current(); };

    const handleRoomUpdated = (updatedRoom) => {
      const id = updatedRoom?._id || updatedRoom?.id;
      if (!id) return;

      if (setJoinedRooms) {
        setJoinedRooms(prev => prev.map(r => (String(r._id) === String(id) ? { ...r, ...updatedRoom } : r)));
      }
      if (setCurrentRoom && String(currentRoomRef.current?._id) === String(id)) {
        setCurrentRoom(prev => (prev ? { ...prev, ...updatedRoom } : prev));
      }
    };

  const handleRoomDeleted = ({ roomId } = {}) => {
  if (!roomId) return;

  if (setJoinedRooms) {
    setJoinedRooms(prev =>
      prev.map(room =>
        String(room._id) === String(roomId)
          ? { ...room, isDeleted: true }
          : room
      )
    );
  }
};

    const handleUserOnline = ({ userId }) => {
      const roomMembers = roomMembersRef.current;
      const privateChats = privateChatsRef.current;
      const currentPrivateChat = currentPrivateChatRef.current;

      if (roomMembers) {
        setRoomMembers(prev => (prev || []).map(member =>
          String(member.id || member._id) === String(userId) ? { ...member, isOnline: true } : member
        ));
      }

      setPrivateChats(prev => (prev || []).map(chat =>
        String(chat.otherUser.id || chat.otherUser._id) === String(userId)
          ? { ...chat, otherUser: { ...chat.otherUser, isOnline: true } }
          : chat
      ));

      if (currentPrivateChat && String(currentPrivateChat.id || currentPrivateChat._id) === String(userId)) {
        setCurrentPrivateChat(prev => prev ? { ...prev, isOnline: true } : prev);
      }
    };

    const handleUserOffline = ({ userId }) => {
      const roomMembers = roomMembersRef.current;
      const privateChats = privateChatsRef.current;
      const currentPrivateChat = currentPrivateChatRef.current;

      if (roomMembers) {
        setRoomMembers(prev => (prev || []).map(member =>
          String(member.id || member._id) === String(userId) ? { ...member, isOnline: false } : member
        ));
      }

      setPrivateChats(prev => (prev || []).map(chat =>
        String(chat.otherUser.id || chat.otherUser._id) === String(userId)
          ? { ...chat, otherUser: { ...chat.otherUser, isOnline: false, lastSeen: new Date().toISOString() } }
          : chat
      ));

      if (currentPrivateChat && String(currentPrivateChat.id || currentPrivateChat._id) === String(userId)) {
        setCurrentPrivateChat(prev => prev ? { ...prev, isOnline: false, lastSeen: new Date().toISOString() } : prev);
      }
    };

    const handleUserJoinedRoom = (eventData = {}) => {
      if (String(currentRoomRef.current?._id) !== String(eventData.roomId)) return;
      const roomMembers = roomMembersRef.current;
      if (!roomMembers) return;
      const exists = roomMembers.some(m => String(m._id || m.id) === String(eventData.userId));
      if (exists) return;
      setRoomMembers(prev => ([
        ...(prev || []),
        {
          _id: eventData.userId,
          username: eventData.username,
          avatar: eventData.avatar,
          gender: eventData.gender,
          role: eventData.role,
          isOnline: true
        }
      ]));
    };

    const handleUserLeftRoom = (eventData = {}) => {
      if (String(currentRoomRef.current?._id) !== String(eventData.roomId)) return;
      const roomMembers = roomMembersRef.current;
      if (!roomMembers) return;
      setRoomMembers(prev => (prev || []).filter(m => String(m._id || m.id) !== String(eventData.userId)));
    };

    const handleRoomReadAck = ({ roomId }) => {
      
      setUnreadCounts(prev => {
        const key = `room_${roomId}`;
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

    const handleUnreadUpdate = ({ chatKey }) => {
      if (!chatKey) return;
      const activeKey = currentPrivateChatRef.current ? `private_${currentPrivateChatRef.current.id}` : null;
      if (chatKey === activeKey) return;
      setUnreadCounts(prev => ({ ...prev, [chatKey]: (prev[chatKey] || 0) + 1 }));
    };

    const handleTypingPrivate = ({ senderId, username, charCount }) => {
      if (!senderId) return;
      setTypingUsers(prev => ({ ...prev, [`private_${senderId}`]: { username: username || 'Someone', charCount } }));
    };

    const handleStopTypingPrivate = ({ senderId }) => {
      if (!senderId) return;
      setTypingUsers(prev => {
        const key = `private_${senderId}`;
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

    const handleTypingRoom = ({ roomId, count }) => {
      if (!roomId) return;
      setTypingUsers(prev => ({ ...prev, [`room_${roomId}`]: count }));
    };

    const handleStopTypingRoom = ({ roomId, count }) => {
      if (!roomId) return;
      setTypingUsers(prev => {
        const key = `room_${roomId}`;
        if (!count) {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        }
        return { ...prev, [key]: count };
      });
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', (error) => console.error('Socket connection error:', error));
    socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
    socket.on('newMessage', handleNewMessage);
    socket.on('newPrivateMessage', handleNewPrivateMessage);
    socket.on('newRoom', handleNewRoom);
    socket.on('roomUpdated', handleRoomUpdated);
    socket.on('roomDeleted', handleRoomDeleted);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('userJoinedRoom', handleUserJoinedRoom);
    socket.on('userLeftRoom', handleUserLeftRoom);
    socket.on('readReceipt', handleReadReceipt);
    socket.on('roomReadAck', handleRoomReadAck);
    socket.on('unreadUpdate', handleUnreadUpdate);
    socket.on('typingPrivate', handleTypingPrivate);
    socket.on('stopTypingPrivate', handleStopTypingPrivate);
    socket.on('typingRoom', handleTypingRoom);
    socket.on('stopTypingRoom', handleStopTypingRoom);

    if (socket.connected) { handleConnect(); }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('newMessage', handleNewMessage);
      socket.off('newPrivateMessage', handleNewPrivateMessage);
      socket.off('newRoom', handleNewRoom);
      socket.off('roomUpdated', handleRoomUpdated);
      socket.off('roomDeleted', handleRoomDeleted);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('userJoinedRoom', handleUserJoinedRoom);
      socket.off('userLeftRoom', handleUserLeftRoom);
      socket.off('readReceipt', handleReadReceipt);
      socket.off('roomReadAck', handleRoomReadAck);
      socket.off('unreadUpdate', handleUnreadUpdate);
      socket.off('typingPrivate', handleTypingPrivate);
      socket.off('stopTypingPrivate', handleStopTypingPrivate);
      socket.off('typingRoom', handleTypingRoom);
      socket.off('stopTypingRoom', handleStopTypingRoom);
    };
  }, [setMessages, setPrivateChats, setRoomMembers, setUnreadCounts, setJoinedRooms, setCurrentRoom]);

  return { socket: socketRef.current, typingUsers };
};