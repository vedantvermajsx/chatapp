import { dbService } from './indexedDB.service';
import messageService from './message.service';
import { toast } from 'sonner';

let isOnline = navigator.onLine;

export const sendPendingMessages = async () => {
  if (!isOnline) return;
  
  try {
    const pendingMessages = await dbService.getPendingMessages();
    
    for (const pendingMsg of pendingMessages) {
      try {
        let finalMedia = pendingMsg.media;
        
        if (pendingMsg.file && pendingMsg.file.buffer) {
          const file = new File(
            [new Blob([pendingMsg.file.buffer])],
            pendingMsg.file.name,
            { type: pendingMsg.file.type }
          );
          const uploadResult = await messageService.uploadFile(file, 'data', true); 
          finalMedia = {
            type: uploadResult.type,
            url: uploadResult.url,
            isPending: false
          };
        }
        
        if (pendingMsg.type === 'room') {
          await messageService.sendRoomMessage({
            roomId: pendingMsg.roomId,
            text: pendingMsg.text,
            media: finalMedia,
            uuid: pendingMsg.id || pendingMsg._id,
            skipToast: true
          });
        } else if (pendingMsg.type === 'private') {
          await messageService.sendPrivateMessage({
            receiverId: pendingMsg.receiverId,
            receiverModel: pendingMsg.receiverModel,
            content: pendingMsg.text,
            media: finalMedia,
            uuid: pendingMsg.id || pendingMsg._id,
            skipToast: true
          });
        }
        
        await dbService.removePendingMessage(pendingMsg.id || pendingMsg._id);
      } catch (error) {
        console.error('Failed to send pending message:', error);
      }
    }
  } catch (error) {
    console.error('Error sending pending messages:', error);
  }
};

export const setupOfflineHandler = () => {
  window.addEventListener('online', () => {
    isOnline = true;
    toast.success('Back online! Sending pending messages...');
    sendPendingMessages();
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
    toast.info('You are offline. Messages will be sent when you are back online.');
  });
  
  sendPendingMessages();
};
