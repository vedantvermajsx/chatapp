import { useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { updatePrivateChatOptimistically } from '../handlers/chat.handlers';
import { dbService } from '../services/indexedDB.service.js';

export const useChatSocket = (user, {
  currentRoom,
  currentPrivateChat,
  setCurrentPrivateChat,
  privateChats,
  setPrivateChats,
  setMessages,
  loadRooms,
  loadPrivateChats,
  messageCache,
  roomMembers,
  setRoomMembers,
  loadRoomMembers
}) => {
  const socketRef = useRef(null);
  const userRef = useRef(user);
  const currentRoomRef = useRef(currentRoom);
  const currentPrivateChatRef = useRef(currentPrivateChat);
  const privateChatsRef = useRef(privateChats);
  const messageCacheRef = useRef(messageCache);
  const roomMembersRef = useRef(roomMembers);

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { currentPrivateChatRef.current = currentPrivateChat; }, [currentPrivateChat]);
  useEffect(() => { privateChatsRef.current = privateChats; }, [privateChats]);
  useEffect(() => { messageCacheRef.current = messageCache; }, [messageCache]);
  useEffect(() => { roomMembersRef.current = roomMembers; }, [roomMembers]);


  useEffect(() => {
    if (!user) return;
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
  }, [user]);

  useEffect(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    const handleConnect = () => {
      const currentUser = userRef.current;
      if (currentUser) {
        socket.emit('join', {
          userId: currentUser.id,
          role: currentUser.role,
          username: currentUser.username,
          gender: currentUser.gender
        });
      }
    };

    const handleNewMessage = async (msg) => {
      const currentUser = userRef.current;
      const currentRoom = currentRoomRef.current;
      const messageCache = messageCacheRef.current;

      const isOwnMessage = msg.userId === currentUser?.id;
      const roomMatch = String(currentRoom?._id) === String(msg.roomId);

      if (roomMatch) {
        const newMessage = {
          id: msg.id || (Date.now() + Math.random()),
          username: msg.username,
          text: msg.text,
          isOwn: isOwnMessage,
          timestamp: msg.timestamp || new Date().toISOString(),
          gender: msg.gender,
          avatar: msg.avatar || null,
          isOnline: msg.isOnline,
          lastSeen: msg.lastSeen,
          media: msg.media || null,
          isPending: false
        };

        setMessages((prev) => {
          const existingOptimisticIndex = prev.findIndex(m =>
            m.isOwn && m.isPending && m.text === newMessage.text && (!!m.media === !!newMessage.media)
          );
          if (isOwnMessage && existingOptimisticIndex !== -1) {
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = newMessage;
            return newMessages;
          }
          if (msg.id && prev.some(m => m.id === msg.id)) return prev;
          return [...prev, newMessage];
        });

        const cacheKey = `room_${msg.roomId}`;
        if (messageCache.current[cacheKey]) {
          const prevMessages = messageCache.current[cacheKey].messages;
          const existingOptimisticIndex = prevMessages.findIndex(m =>
            m.isOwn && m.isPending && m.text === newMessage.text && (!!m.media === !!newMessage.media)
          );

          let newCacheMessages;
          if (isOwnMessage && existingOptimisticIndex !== -1) {
            newCacheMessages = [...prevMessages];
            newCacheMessages[existingOptimisticIndex] = newMessage;
          } else {
            const already = prevMessages.some((m) => String(m.id) === String(newMessage.id));
            newCacheMessages = already ? prevMessages : [...prevMessages, newMessage];
          }

          if (newCacheMessages !== prevMessages) {
            messageCache.current[cacheKey] = {
              ...messageCache.current[cacheKey],
              messages: newCacheMessages
            };
          }
        }
        
        await dbService.addMessage(cacheKey, newMessage);
      }
    };

    const handleNewPrivateMessage = async (msg) => {
      const currentUser = userRef.current;
      const currentPrivateChat = currentPrivateChatRef.current;
      const privateChats = privateChatsRef.current;
      const messageCache = messageCacheRef.current;

      const otherUserId = msg.senderId === currentUser?.id ? msg.receiverId : msg.senderId;
      const isOwnMessage = msg.senderId === currentUser?.id;

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
        id: msg.id || Date.now() + Math.random(),
        username: msg.senderUsername || msg.username,
        text: msg.content,
        isOwn: isOwnMessage,
        timestamp: msg.timestamp || new Date().toISOString(),
        gender: msg.gender,
        avatar: msg.avatar || null,
        isOnline: msg.isOnline,
        lastSeen: msg.lastSeen,
        media: msg.media || null,
        isPending: false
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
          hasMore: true,
          timestamp: Date.now()
        };
      }

      if (currentPrivateChat?.id === otherUserId || currentPrivateChat?.id === msg.receiverId) {
        setMessages((prev) => {
          const existingOptimisticIndex = prev.findIndex(m =>
            m.isOwn && m.isPending && m.text === newMessageObj.text && (!!m.media === !!newMessageObj.media)
          );
          if (isOwnMessage && existingOptimisticIndex !== -1) {
            const newMessages = [...prev];
            newMessages[existingOptimisticIndex] = newMessageObj;
            return newMessages;
          }
          if (msg.id && prev.some(m => m.id === msg.id)) return prev;
          return [...prev, newMessageObj];
        });
      }
      
      await dbService.addMessage(cacheKey, newMessageObj);
    };

    const handleNewRoom = () => { loadRooms(); };

    const handleUserJoinedRoom = (data) => {
      const currentRoom = currentRoomRef.current;
      if (currentRoom) {
        setMessages((prev) => [...prev, {
          id: Date.now() + Math.random(),
          type: 'system',
          text: `${data.username} joined the chat`
        }]);
        loadRoomMembers();
      }
    };

    const handleUserLeftRoom = ({ username }) => {
      const currentRoom = currentRoomRef.current;
      if (currentRoom) {
        setMessages((prev) => [...prev, {
          id: Date.now() + Math.random(),
          type: 'system',
          text: `${username} left the chat`
        }]);
        loadRoomMembers();
      }
    };

    const handleUserOnline = ({ userId }) => {
      const roomMembers = roomMembersRef.current;
      const privateChats = privateChatsRef.current;
      const currentPrivateChat = currentPrivateChatRef.current;

      if (roomMembers) {
        setRoomMembers(prev => (prev || []).map(member =>
          member.id.toString() === userId.toString() ? { ...member, isOnline: true } : member
        ));
      }

      setPrivateChats(prev => (prev || []).map(chat =>
        chat.otherUser.id.toString() === userId.toString()
          ? { ...chat, otherUser: { ...chat.otherUser, isOnline: true } }
          : chat
      ));

      if (currentPrivateChat && currentPrivateChat.id.toString() === userId.toString()) {
        setCurrentPrivateChat(prev => prev ? { ...prev, isOnline: true } : prev);
      }
    };

    const handleUserOffline = ({ userId }) => {
      const roomMembers = roomMembersRef.current;
      const privateChats = privateChatsRef.current;
      const currentPrivateChat = currentPrivateChatRef.current;

      if (roomMembers) {
        setRoomMembers(prev => (prev || []).map(member =>
          member.id.toString() === userId.toString() ? { ...member, isOnline: false } : member
        ));
      }

      setPrivateChats(prev => (prev || []).map(chat =>
        chat.otherUser.id.toString() === userId.toString()
          ? { ...chat, otherUser: { ...chat.otherUser, isOnline: false, lastSeen: new Date().toISOString() } }
          : chat
      ));

      if (currentPrivateChat && currentPrivateChat.id.toString() === userId.toString()) {
        setCurrentPrivateChat(prev => prev ? { ...prev, isOnline: false, lastSeen: new Date().toISOString() } : prev);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('connect_error', (error) => console.error('Socket connection error:', error));
    socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
    socket.on('newMessage', handleNewMessage);
    socket.on('newPrivateMessage', handleNewPrivateMessage);
    socket.on('newRoom', handleNewRoom);
    socket.on('userJoinedRoom', handleUserJoinedRoom);
    socket.on('userLeftRoom', handleUserLeftRoom);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);

    if (socket.connected) { handleConnect(); }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('newMessage', handleNewMessage);
      socket.off('newPrivateMessage', handleNewPrivateMessage);
      socket.off('newRoom', handleNewRoom);
      socket.off('userJoinedRoom', handleUserJoinedRoom);
      socket.off('userLeftRoom', handleUserLeftRoom);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
    };
  }, [setMessages, setPrivateChats, setRoomMembers, loadRooms, loadPrivateChats, loadRoomMembers]);

  return socketRef.current;
};
