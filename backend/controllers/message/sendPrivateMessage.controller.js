import xss from 'xss';
import userCacheClient from '../../database/userCacheClient.js';
import emitNewPrivateMessage from '../../emitters/newPrivateMessage.emitter.js';
import { enqueueMessage } from '../../utils/queueClient.js';
import { v4 as uuidv4 } from 'uuid';
import { messageCacheClient } from '../../database/messageCacheClient.js';

export async function sendPrivateMessage(req, res) {
  try {
    const { receiverId, content, media } = req.body;
    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId required' });
    }

    const receiver = await userCacheClient.getUserById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const sender = req.user;
    const uuid = uuidv4();
    const sanitizedContent = xss(content || '');
    const timestamp = new Date();

    const messageData = {
      uuid,
      content: sanitizedContent,
      senderId: sender.id,
      receiverId,
      roomId: null,
      media: media || null,
      timestamp,
      status: 'sent'
    };

    const payload = {
      id: uuid,
      senderId: sender.id,
      senderUsername: sender.username,
      username: sender.username,
      content: sanitizedContent,
      receiverId,
      timestamp,
      gender: sender.gender,
      avatar: sender.avatar,
      isOnline: sender.isOnline,
      lastSeen: sender.lastSeen,
      media: media || null
    };

    enqueueMessage(messageData); 
    emitNewPrivateMessage(sender.id, receiverId, payload);

    await messageCacheClient.appendPrivateMessage(sender.id, receiverId, messageData);

    res.json({
      _id: uuid,
      ...messageData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
