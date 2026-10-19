import { dbService } from './indexedDB.service';
import messageService from './message.service';
import roomService from './room.service';
import { toast } from 'sonner';
import { registerUpload, releaseUpload, isUploadCancelled, cancelUpload } from './uploadCancel.js';
import { catchUpNewerMessagesHandler } from '../handlers/chat.handlers';
import { applyLastRead } from '../utils/applyLastRead.js';
import { syncUnreadFromResponse } from '../utils/syncUnreadCount.js';

let isOnline = navigator.onLine;
let isSending = false;
let dependencies = {
  messageCache: null,
  setUnreadCounts: null,
  setHasMoreNewerMessages: null,
  setMessages: null,
  currentRoom: null,
  currentPrivateChat: null,
  getRoom: null
};

export const setOfflineHandlerDependencies = (deps) => {
  dependencies = { ...dependencies, ...deps };
};

const chatInfoOf = (p) => p.type === 'room'
  ? { chatId: p.roomId, cacheKey: `room_${p.roomId}` }
  : { chatId: p.receiverId, cacheKey: `private_${p.receiverId}` };

const catchUpChat = async (type, chatId, cacheKey) => {
  const cache = dependencies.messageCache?.current;
  if (!cache) throw new Error('message cache not ready');

  let roomKey = null;
  if (type === 'room') {
    const room = dependencies.getRoom?.(chatId);
    if (!room) throw new Error('room not loaded yet');
    roomKey = room.privateKey ?? null;
  }

  let entry = cache[cacheKey];
  if (!entry?.messages?.length) {
    const idb = await dbService.getMessages(cacheKey);
    if (idb.messages.length) {
      entry = { messages: idb.messages, hasMore: idb.hasMore, timestamp: Date.now() };
      cache[cacheKey] = entry;
    }
  }

  if (entry?.messages?.length) {
    const isCurrent =
      (type === 'room' && dependencies.currentRoom?._id === chatId) ||
      (type === 'private' && dependencies.currentPrivateChat?.id === chatId);
    await catchUpNewerMessagesHandler(
      chatId,
      type,
      entry.messages,
      isCurrent ? dependencies.setMessages : () => {},
      isCurrent ? dependencies.setHasMoreNewerMessages : () => {},
      dependencies.messageCache,
      dependencies.setUnreadCounts,
      roomKey,
      true
    );
    return;
  }

  // no local history: load the latest page first so the chat isn't left with only our own sent messages
  const res = type === 'room'
    ? await messageService.getRoomMessages(chatId, 20, null, null, roomKey)
    : await messageService.getPrivateMessages(chatId, 20);
  const msgs = type === 'private' ? applyLastRead(res.messages, res.lastRead) : res.messages;
  if (msgs?.length) {
    await dbService.saveMessages(cacheKey, msgs, res.hasMore);
    cache[cacheKey] = { messages: msgs, hasMore: res.hasMore, timestamp: Date.now() };
  }
  syncUnreadFromResponse(dependencies.setUnreadCounts, cacheKey, res.unreadCount);
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

    const failedChats = new Set();
    const seen = new Set();
    for (const p of pendingMessages) {
      if (isUploadCancelled(p.id || p._id)) continue;
      const { chatId, cacheKey } = chatInfoOf(p);
      if (seen.has(cacheKey)) continue;
      seen.add(cacheKey);
      try {
        await catchUpChat(p.type, chatId, cacheKey);
      } catch (error) {
        console.error(`Catch-up failed for ${cacheKey}, keeping its messages pending:`, error);
        failedChats.add(cacheKey);
      }
    }

    // 2) send
    for (const pendingMsg of pendingMessages) {
      const tempId = pendingMsg.id || pendingMsg._id;
      if (isUploadCancelled(tempId)) continue;
      const { cacheKey } = chatInfoOf(pendingMsg);
      if (failedChats.has(cacheKey)) continue;

      try {
        let finalMedia = pendingMsg.media || null;
        if (pendingMsg.mediaType && pendingMsg.mediaId) {
          const file = await dbService.getFile(pendingMsg.mediaId);
          if (!file) {
            // file was lost (app closed before it was saved) - nothing to upload, drop the message
            cancelUpload(tempId);
            continue;
          }
          if (file) {
            const checkCurrentChat = () =>
              (pendingMsg.type === 'room' && dependencies.currentRoom?._id === pendingMsg.roomId) ||
              (pendingMsg.type === 'private' && dependencies.currentPrivateChat?.id === pendingMsg.receiverId);
            const isCurrentChat = checkCurrentChat();

            const updateProgress = (progress) => {
              if (dependencies.messageCache?.current?.[cacheKey]) {
                dependencies.messageCache.current[cacheKey] = {
                  ...dependencies.messageCache.current[cacheKey],
                  messages: dependencies.messageCache.current[cacheKey].messages.map((msg) =>
                    (msg.id || msg._id) === tempId ? { ...msg, uploadProgress: progress } : msg
                  )
                };
              }
              if (checkCurrentChat() && dependencies.setMessages) {
                dependencies.setMessages((prev) =>
                  prev.map((msg) =>
                    (msg.id || msg._id) === tempId ? { ...msg, uploadProgress: progress } : msg
                  )
                );
              }
            };

            // Reflect that the upload is actively resuming rather than stuck at 0%
            updateProgress(0);

            // blob: preview URLs from the previous session are dead after a restart - rebuild it from the stored file
            const previewUrl = URL.createObjectURL(file);
            const setPreview = (list) => list.map((msg) =>
              (msg.id || msg._id) === tempId && msg.media ? { ...msg, media: { ...msg.media, url: previewUrl } } : msg
            );
            if (dependencies.messageCache?.current?.[cacheKey]) {
              dependencies.messageCache.current[cacheKey] = {
                ...dependencies.messageCache.current[cacheKey],
                messages: setPreview(dependencies.messageCache.current[cacheKey].messages)
              };
            }
            if (checkCurrentChat() && dependencies.setMessages) dependencies.setMessages(setPreview);

            const uploadController = registerUpload(tempId);
            let uploadResult;
            try {
              uploadResult = await messageService.uploadFile(file, 'data', true, updateProgress, uploadController.signal);
            } finally {
              releaseUpload(tempId);
              URL.revokeObjectURL(previewUrl);
            }
            // keep thumbnail/low/mid/hd so the sender sees a preview (video/image) after the upload
            finalMedia = {
              ...uploadResult,
              isPending: false
            };

            updateProgress(null);
          }
        }

        let response;
        if (pendingMsg.type === 'room') {
          response = await messageService.sendRoomMessage({
            roomId: pendingMsg.roomId,
            text: pendingMsg.text,
            media: finalMedia,
            uuid: tempId,
            roomPublicKey: pendingMsg.roomPublicKey || null,
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
        if (isUploadCancelled(tempId)) continue;
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