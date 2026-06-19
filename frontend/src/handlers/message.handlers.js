import messageService from '../services/message.service.js';
import { updatePrivateChatOptimistically } from './private.handlers.js';
import { dbService } from '../services/indexedDB.service.js';

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
  if (!inputMessage && !selectedFile) return;

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


  let fileData = null;
  if (selectedFile) {
    fileData = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        buffer: reader.result,
        name: selectedFile.name,
        type: selectedFile.type
      });
      reader.onerror = reject;
      reader.readAsArrayBuffer(selectedFile);
    });
  }

  const optimisticMessage = {
    id: tempId,
    username: user.username,
    text: inputMessage,
    isOwn: true,
    timestamp: new Date().toISOString(),
    gender: user.gender,
    avatar: user.avatar || null,
    media: pendingMedia,
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
        text: inputMessage,
        media: pendingMedia,
        file: fileData, 
        timestamp: new Date().toISOString()
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
      
      let finalMediaToUse = finalMedia;
      if (selectedFile) {
        const uploadResult = await messageService.uploadFile(selectedFile);
        finalMediaToUse = {
          type: uploadResult.type,
          url: uploadResult.url,
          isPending: false
        };
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        await dbService.addPendingMessage({ ...pendingMessageData, media: finalMediaToUse });
      }

      if (currentRoom) {
        const response = await messageService.sendRoomMessage({
          roomId: currentRoom._id,
          text: inputMessage,
          media: finalMediaToUse,
          uuid: tempId
        });

        const newMessageObj = {
          id: response._id,
          username: user.username,
          text: inputMessage,
          isOwn: true,
          timestamp: response.timestamp,
          gender: user.gender,
          avatar: user.avatar || null,
          media: finalMediaToUse,
          isPending: false
        };

        setMessages((prev)=>prev.map((msg)=> (msg.id === tempId || msg.id === newMessageObj.id? newMessageObj:msg)));

        const cacheKey = `room_${currentRoom._id}`;
        if (messageCache.current[cacheKey]) {
          messageCache.current[cacheKey] = {
            ...messageCache.current[cacheKey],
            messages: messageCache.current[cacheKey].messages.map((msg) =>
              (msg.id === tempId || msg.id === newMessageObj.id) ? newMessageObj : msg
            )
          };
        }
        await dbService.addMessage(cacheKey, newMessageObj);
        await dbService.removePendingMessage(tempId);
      } else if (currentPrivateChat) {
        const response = await messageService.sendPrivateMessage({
          receiverId: currentPrivateChat.id.toString(),
          receiverModel: currentPrivateChat.role === 'guest' ? 'Guest' : 'User',
          content: inputMessage,
          media: finalMediaToUse,
          uuid: tempId
        });

        const newMessageObj = {
          id: response._id,
          username: user.username,
          text: inputMessage,
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
              (msg.id === tempId || msg.id === newMessageObj.id) ? newMessageObj : msg
            )
          };
        }
        await dbService.addMessage(cacheKey, newMessageObj);
        await dbService.removePendingMessage(tempId);

        updatePrivateChatOptimistically(privateChats, setPrivateChats, currentPrivateChat, inputMessage);
      }
    } catch (error) {
      console.error('Failed to send message immediately:', error);
    }
  })();
};
