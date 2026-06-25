import roomCacheClient from '../../database/roomCacheClient.js';
import xss from 'xss';
import emitNewMessage from '../../emitters/newMessage.emitter.js';
import { enqueueMessage } from '../../utils/queueClient.js';
import { v4 as uuidv4 } from 'uuid';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import getThumbnail from '../../utils/getThumbnail.js';

export async function sendRoomMessage(req, res) {
  try {
    const { roomId, message, media, isSystemMessage, systemType } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'roomId required' });
    }

    const room = await roomCacheClient.isValidRoomId(roomId);

    if (!room || !room.isValid || room.id !== roomId) {
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
      isSystemMessage: isSystemMessage || false,
      systemType: systemType || null,
      roomId,
      receiverId: null,
      media: media || null,
      timestamp,
    };

    const emittedMedia = media?.url
      ? {
          ...media,
          thumbnailUrl: getThumbnail(
            media.url,
            media.type === 'video',
            media.type === 'audio'
          ),
        }
      : null;

    const payload = {
      id: uuid,
      roomId,
      userId: sender.id,
      username: sender.username,
      text: content,
      isSystemMessage: isSystemMessage || false,
      systemType: systemType || null,
      timestamp,
      gender: sender.gender,
      avatar: sender.avatar,
      isOnline: sender.isOnline,
      lastSeen: sender.lastSeen,
      media: emittedMedia,
    };

    enqueueMessage(messageData);

    emitNewMessage(roomId, payload);

    await messageCacheClient.appendRoomMessage(roomId, messageData);

    res.status(201).json({
      _id: uuid,
      ...messageData,
    });
  } catch (err) {
    console.error('sendRoomMessage error:', err);
    res.status(500).json({ message: err.message });
  }
}