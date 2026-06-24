import roomCacheClient from '../../database/roomCacheClient.js';
import xss from 'xss';
import emitNewMessage from '../../emitters/newMessage.emitter.js';
import { enqueueMessage } from '../../utils/queueClient.js';
import { v4 as uuidv4 } from 'uuid';
import { messageCacheClient } from '../../database/messageCacheClient.js';

export async function sendRoomMessage(req, res) {
  try {
    const { roomId, message, media } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'roomId required' });
    }

    const room = await roomCacheClient.isValidRoomId(roomId);
  
    if (!room || !room.isValid || room.id!==roomId) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const sender = req.user;
    const uuid = uuidv4();
    const content = xss(message || '');
    const timestamp = new Date();

    const messageData = {
      uuid,
      content,
      senderId: sender.id,
      roomId,
      receiverId: null,
      media: media || null,
      timestamp,
      status: 'sent'
    };

    const payload = {
      id: uuid,
      roomId,
      userId: sender.id,
      username: sender.username,
      text: content,
      timestamp,
      gender: sender.gender,
      avatar: sender.avatar,
      isOnline: sender.isOnline,
      lastSeen: sender.lastSeen,
      media: media || null
    };


    enqueueMessage(messageData); 
    emitNewMessage(roomId, payload);

    await messageCacheClient.appendRoomMessage(roomId, messageData);

    res.status(201).json({
      _id: uuid,
      ...messageData
    });
  } catch (err) {
    console.error('sendRoomMessage error:', err);
    res.status(500).json({ message: err.message });
  }
}
