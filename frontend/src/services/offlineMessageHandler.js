import { dbService } from './indexedDB.service';
import messageService from './message.service';
import { toast } from 'sonner';

let isOnline = navigator.onLine;
let isSending = false;

export const sendPendingMessages = async () => {
  if (!isOnline || isSending) return;
  isSending = true;

  try {
    const pendingMessages = await dbService.getPendingMessages();
    if (!pendingMessages.length) return;

    for (const pendingMsg of pendingMessages) {
      const tempId = pendingMsg.id || pendingMsg._id;
      const cacheKey = pendingMsg.type === 'room'
        ? `room_${pendingMsg.roomId}`
        : `private_${pendingMsg.receiverId}`;

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
          const finalMessage = {
            id: response._id || tempId,
            text: pendingMsg.text,
            isOwn: true,
            timestamp: response.timestamp || pendingMsg.timestamp,
            media: finalMedia,
            isPending: false
          };

          await dbService.addMessage(cacheKey, finalMessage);
          if (finalMessage.id !== tempId) {
            await dbService.removeMessage(cacheKey, tempId);
          }

          // Let any mounted UI update the message it has in memory, since this
          // can complete long after the original tab/component sent it.
          window.dispatchEvent(new CustomEvent('pending-message-sent', {
            detail: { cacheKey, tempId, message: finalMessage }
          }));
        }

        await dbService.removePendingMessage(tempId);
        if (pendingMsg.mediaId) await dbService.removeFile(pendingMsg.mediaId);
      } catch (error) {
        console.error('Failed to send pending message:', error);
        // Leave it in the pending store so it is retried on the next reconnect.
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
      toast.success('Back online! Sending pending messages...');
    }
    sendPendingMessages();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    toast.info('You are offline. Messages will be sent when you are back online.');
  });

  sendPendingMessages();
};
