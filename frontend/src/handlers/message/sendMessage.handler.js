import messageService from '../../services/message.service.js';
import { updatePrivateChatOptimistically } from '../private/updatePrivateChatOptimistically.handler.js';
import { dbService } from '../../services/indexedDB.service.js';

export const sendMessageHandler = async (
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
) => {
  e.preventDefault();
  const trimmedMessage = (inputMessage || '').trim();
  if (!trimmedMessage && !selectedFile) return;

  const tempId = crypto.randomUUID();
  let pendingMedia = null;
  let localPreviewUrl = null;

  if (selectedFile) {
    localPreviewUrl = URL.createObjectURL(selectedFile);
    pendingMedia = {
      type: selectedFile.type.startsWith('image/gif') ? 'gif' : selectedFile.type.startsWith('video') ? 'video' : 'image',
      url: localPreviewUrl,
      isPending: true
    };
  }



  const optimisticMessage = {
  id: tempId,
  username: user.username,
  text: trimmedMessage,
  isOwn: true,
  timestamp: new Date().toISOString(),
  gender: user.gender,
  avatar: user.avatar || null,
  media: pendingMedia,
  uploadProgress: 0,
  isPending: true
};

  if (currentRoom) {
    setMessages((prev) => [...prev, optimisticMessage]);
    const cacheKey = `room_${currentRoom._id}`;
    if (messageCache.current[cacheKey]) {
      messageCache.current[cacheKey] = {
        ...messageCache.current[cacheKey],
        messages: [...messageCache.current[cacheKey].messages, optimisticMessage]
      };
    }
    await dbService.addMessage(cacheKey, optimisticMessage);
  } else if (currentPrivateChat) {
    setMessages((prev) => [...prev, optimisticMessage]);
    const cacheKey = `private_${currentPrivateChat.id}`;
    if (messageCache.current[cacheKey]) {
      messageCache.current[cacheKey] = {
        ...messageCache.current[cacheKey],
        messages: [...messageCache.current[cacheKey].messages, optimisticMessage]
      };
    }
    await dbService.addMessage(cacheKey, optimisticMessage);
  }

  setInputMessage('');
  setSelectedFile(null);

  (async () => {
    try {
      let finalMedia = pendingMedia;

      const pendingMessageData = {
        id: tempId,
        text: trimmedMessage,
        media: pendingMedia,
        mediaType: pendingMedia?.type || null,
        mediaId: selectedFile ? tempId : null,
        timestamp: new Date().toISOString(),
        username: user.username,
        avatar: user.avatar || null,
        gender: user.gender
      };

      if (currentRoom) {
        pendingMessageData.type = 'room';
        pendingMessageData.roomId = currentRoom._id;
      } else if (currentPrivateChat) {
        pendingMessageData.type = 'private';
        pendingMessageData.receiverId = currentPrivateChat.id.toString();
        pendingMessageData.receiverModel = currentPrivateChat.role === 'guest' ? 'Guest' : 'User';
      }

      await dbService.addPendingMessage(pendingMessageData);
      if (selectedFile) {
        await dbService.addFile(tempId, selectedFile);
      }

      if (!navigator.onLine) {
        return;
      }

      let finalMediaToUse = finalMedia;
      if (selectedFile) {
        const uploadResult = await messageService.uploadFile(
  selectedFile,
  'data',
  false,
  (progress) => {
    setMessages(prev =>
      prev.map(msg =>
        (msg.id || msg._id) === tempId
          ? {
              ...msg,
              uploadProgress: progress
            }
          : msg
      )
    );

    const cacheKey = currentRoom
      ? `room_${currentRoom._id}`
      : `private_${currentPrivateChat.id}`;

    if (messageCache.current[cacheKey]) {
      messageCache.current[cacheKey].messages =
        messageCache.current[cacheKey].messages.map(msg =>
          (msg.id || msg._id) === tempId
            ? {
                ...msg,
                uploadProgress: progress
              }
            : msg
        );
    }
  }
);

        finalMediaToUse = {
          ...uploadResult,
          isPending: false
        };
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        await dbService.addPendingMessage({ ...pendingMessageData, media: finalMediaToUse });
      }

      if (currentRoom) {
        const response = await messageService.sendRoomMessage({
          roomId: currentRoom._id,
          text: trimmedMessage,
          media: finalMediaToUse,
          uuid: tempId
        });

        const newMessageObj = {
          id: response._id,
          username: user.username,
          text: trimmedMessage,
          isOwn: true,
          timestamp: response.timestamp,
          gender: user.gender,
          avatar: user.avatar || null,
          media: finalMediaToUse,
          isPending: false
        };

        setMessages((prev)=>prev.map((msg)=> ((msg.id || msg._id) === tempId || (msg.id || msg._id) === newMessageObj.id? newMessageObj:msg)));

        const cacheKey = `room_${currentRoom._id}`;
        if (messageCache.current[cacheKey]) {
          messageCache.current[cacheKey] = {
            ...messageCache.current[cacheKey],
            messages: messageCache.current[cacheKey].messages.map((msg) =>
              (msg.id || msg._id) === tempId || (msg.id || msg._id) === newMessageObj.id ? newMessageObj : msg
            )
          };
        }
        await dbService.addMessage(cacheKey, newMessageObj);
        if (tempId !== newMessageObj.id) await dbService.removeMessage(cacheKey, tempId);
        await dbService.removePendingMessage(tempId);
        if (selectedFile) await dbService.removeFile(tempId);
      } else if (currentPrivateChat) {
        const response = await messageService.sendPrivateMessage({
          receiverId: currentPrivateChat.id.toString(),
          receiverModel: currentPrivateChat.role === 'guest' ? 'Guest' : 'User',
          content: trimmedMessage,
          media: finalMediaToUse,
          uuid: tempId
        });

        const newMessageObj = {
          id: response._id,
          username: user.username,
          text: trimmedMessage,
          isOwn: true,
          timestamp: response.timestamp,
          gender: user.gender,
          avatar: user.avatar || null,
          media: finalMediaToUse,
          isPending: false
        };
        
        setMessages((prev) => prev.map((msg) => (msg.id === tempId || msg.id === newMessageObj.id) ? newMessageObj : msg));

        const cacheKey = `private_${currentPrivateChat.id}`;
        if (messageCache.current[cacheKey]) {
          messageCache.current[cacheKey] = {
            ...messageCache.current[cacheKey],
            messages: messageCache.current[cacheKey].messages.map((msg) =>
              (msg.id || msg._id) === tempId || (msg.id || msg._id) === newMessageObj.id ? newMessageObj : msg
            )
          };
        }
        await dbService.addMessage(cacheKey, newMessageObj);
        if (tempId !== newMessageObj.id) await dbService.removeMessage(cacheKey, tempId);
        await dbService.removePendingMessage(tempId);
        if (selectedFile) await dbService.removeFile(tempId);

        updatePrivateChatOptimistically(privateChats, setPrivateChats, currentPrivateChat, trimmedMessage);
      }
    } catch (error) {
      console.error('Failed to send message immediately:', error);
    }
  })();
};


export const sendStickerHandler = async (
  sticker,
  currentRoom,
  currentPrivateChat,
  user,
  setMessages,
  privateChats,
  setPrivateChats,
  messageCache
) => {
  if (!sticker?.url) return;

  const tempId = crypto.randomUUID();

  const stickerMedia = {
    type: 'sticker',
    url: sticker.url,
    isPending: true
  };

  const optimisticMessage = {
    id: tempId,
    username: user.username,
    text: '',
    isOwn: true,
    timestamp: new Date().toISOString(),
    gender: user.gender,
    avatar: user.avatar || null,
    media: stickerMedia,
    isPending: true
  };

  if (currentRoom) {
    setMessages((prev) => [...prev, optimisticMessage]);
    const cacheKey = `room_${currentRoom._id}`;
    if (messageCache.current[cacheKey]) {
      messageCache.current[cacheKey] = {
        ...messageCache.current[cacheKey],
        messages: [...messageCache.current[cacheKey].messages, optimisticMessage]
      };
    }
    await dbService.addMessage(cacheKey, optimisticMessage);
  } else if (currentPrivateChat) {
    setMessages((prev) => [...prev, optimisticMessage]);
    const cacheKey = `private_${currentPrivateChat.id}`;
    if (messageCache.current[cacheKey]) {
      messageCache.current[cacheKey] = {
        ...messageCache.current[cacheKey],
        messages: [...messageCache.current[cacheKey].messages, optimisticMessage]
      };
    }
    await dbService.addMessage(cacheKey, optimisticMessage);
  }

  (async () => {
    try {
      const finalMedia = { type: 'sticker', url: sticker.url, isPending: false };

      let response;
      if (currentRoom) {
        response = await messageService.sendRoomMessage({
          roomId: currentRoom._id,
          text: '',
          media: finalMedia,
          uuid: tempId
        });
      } else if (currentPrivateChat) {
        response = await messageService.sendPrivateMessage({
          receiverId: currentPrivateChat.id.toString(),
          receiverModel: currentPrivateChat.role === 'guest' ? 'Guest' : 'User',
          content: '',
          media: finalMedia,
          uuid: tempId
        });
      }

      if (!response) return;

      const newMessageObj = {
        id: response._id,
        username: user.username,
        text: '',
        isOwn: true,
        timestamp: response.timestamp,
        gender: user.gender,
        avatar: user.avatar || null,
        media: finalMedia,
        isPending: false
      };

      setMessages((prev) => prev.map((msg) =>
        (msg.id || msg._id) === tempId || (msg.id || msg._id) === newMessageObj.id ? newMessageObj : msg
      ));

      if (currentRoom) {
        const cacheKey = `room_${currentRoom._id}`;
        if (messageCache.current[cacheKey]) {
          messageCache.current[cacheKey] = {
            ...messageCache.current[cacheKey],
            messages: messageCache.current[cacheKey].messages.map((msg) =>
              (msg.id || msg._id)  === tempId || (msg.id || msg._id) === newMessageObj.id ? newMessageObj : msg
            )
          };
        }
        await dbService.addMessage(cacheKey, newMessageObj);
        if (tempId !== newMessageObj.id) await dbService.removeMessage(cacheKey, tempId);
      } else if (currentPrivateChat) {
        const cacheKey = `private_${currentPrivateChat.id}`;
        if (messageCache.current[cacheKey]) {
          messageCache.current[cacheKey] = {
            ...messageCache.current[cacheKey],
            messages: messageCache.current[cacheKey].messages.map((msg) =>
              (msg.id || msg._id)  === tempId || (msg.id || msg._id) === newMessageObj.id ? newMessageObj : msg
            )
          };
        }
        await dbService.addMessage(cacheKey, newMessageObj);
        if (tempId !== newMessageObj.id) await dbService.removeMessage(cacheKey, tempId);
        updatePrivateChatOptimistically(privateChats, setPrivateChats, currentPrivateChat, '🎭');
      }
    } catch (error) {
      console.error('Failed to send sticker:', error);
    }
  })();
};