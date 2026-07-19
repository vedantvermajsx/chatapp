import { dbService } from './indexedDB.service';
import messageService from './message.service';
import roomService from './room.service';
import { toast } from 'sonner';
import { catchUpNewerMessagesHandler } from '../handlers/chat.handlers';

let isOnline = navigator.onLine;
let isSending = false;
let dependencies = {
  messageCache: null,
  setUnreadCounts: null,
  setHasMoreNewerMessages: null,
  setMessages: null,
  currentRoom: null,
  currentPrivateChat: null
};

export const setOfflineHandlerDependencies = (deps) => {
  dependencies = { ...dependencies, ...deps };
};

export const sendPendingMessages = async () => {
  if (!isOnline || isSending) return;
  isSending = true;

  try {
    if (dependencies.setUnreadCounts) {
      const unreadCounts = await roomService.getUnreadCounts();
      dependencies.setUnreadCounts(unreadCounts);
    }

    const pendingMessages = await dbService.getPendingMessages();
    if (!pendingMessages.length) return;

    const caughtUpChats = new Set();

    for (const pendingMsg of pendingMessages) {
      const tempId = pendingMsg.id || pendingMsg._id;
      const cacheKey = pendingMsg.type === 'room'
        ? `room_${pendingMsg.roomId}`
        : `private_${pendingMsg.receiverId}`;

      if (!caughtUpChats.has(cacheKey) && dependencies.messageCache) {
        const chatData = dependencies.messageCache.current[cacheKey];
        if (chatData?.messages && chatData.messages.length > 0) {
          const chatId = pendingMsg.type === 'room' ? pendingMsg.roomId : pendingMsg.receiverId;
          const type = pendingMsg.type;

          const setMessagesForCache = () => {
            const isCurrentRoom = type === 'room' && dependencies.currentRoom?._id === chatId;
            const isCurrentPrivate = type === 'private' && dependencies.currentPrivateChat?.id === chatId;
            return (isCurrentRoom || isCurrentPrivate) ? dependencies.setMessages : () => {};
          };

          await catchUpNewerMessagesHandler(
            chatId,
            type,
            chatData.messages,
            setMessagesForCache(),
            dependencies.setHasMoreNewerMessages,
            dependencies.messageCache,
            dependencies.setUnreadCounts
          );
          caughtUpChats.add(cacheKey);
        }
      }

      try {
        let finalMedia = pendingMsg.media || null;
        if (pendingMsg.mediaType && pendingMsg.mediaId) {
          const file = await dbService.getFile(pendingMsg.mediaId);
          if (file) {
            const uploadResult = await messageService.uploadFile(file, 'data', true);
            finalMedia = {
              type: uploadResult.type,
              url: uploadResult.url,
              isPending: false
            };
          }
        }

        let response;
        if (pendingMsg.type === 'room') {
          response = await messageService.sendRoomMessage({
            roomId: pendingMsg.roomId,
            text: pendingMsg.text,
            media: finalMedia,
            uuid: tempId,
            skipToast: true
          });
        } else if (pendingMsg.type === 'private') {
          response = await messageService.sendPrivateMessage({
            receiverId: pendingMsg.receiverId,
            receiverModel: pendingMsg.receiverModel,
            content: pendingMsg.text,
            media: finalMedia,
            uuid: tempId,
            skipToast: true
          });
        }

        if (response) {
          const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

          const finalMessage = {
            id: response._id || tempId,
            text: pendingMsg.text,
            isOwn: true,
            timestamp: response.timestamp || pendingMsg.timestamp,
            media: finalMedia,
            isPending: false,
            username: pendingMsg.username || currentUser?.username,
            avatar: pendingMsg.avatar || currentUser?.avatar || null,
            gender: pendingMsg.gender || currentUser?.gender
          };

          await dbService.addMessage(cacheKey, finalMessage);
          if (finalMessage.id !== tempId) {
            await dbService.removeMessage(cacheKey, tempId);
          }

          window.dispatchEvent(new CustomEvent('pending-message-sent', {
            detail: { cacheKey, tempId, message: finalMessage }
          }));
        }

        await dbService.removePendingMessage(tempId);
        if (pendingMsg.mediaId) await dbService.removeFile(pendingMsg.mediaId);
      } catch (error) {
        console.error('Failed to send pending message:', error);
      }
    }
  } catch (error) {
    console.error('Error sending pending messages:', error);
  } finally {
    isSending = false;
  }
};

export const setupOfflineHandler = () => {
  window.addEventListener('online', async () => {
    isOnline = true;
    const pending = await dbService.getPendingMessages();
    if (pending.length > 0) {
      toast.success('Back online! Catching up on new messages and sending pending messages...');
    }
    sendPendingMessages();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    toast.info('You are offline. Messages will be sent when you are back online.');
  });

  sendPendingMessages();
};