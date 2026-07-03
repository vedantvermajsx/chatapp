import mongoose from 'mongoose';
import roomCacheClient from '../../database/roomCacheClient.js';
import xss from 'xss';
import emitNewMessage from '../../emitters/newMessage.emitter.js';
import { enqueueMessage } from '../../utils/queueClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import { onlineUsers } from '../../socket.js';
import { _addQualities } from '../../utils/addQualities.js';
import userCacheClient from '../../database/userCacheClient.js';

export async function sendRoomMessage(req, res) {
  try {
    const { roomId, message, media, isSystemMessage, systemType } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: 'roomId required' });
    }

    const room = await roomCacheClient.isValidRoomId(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if(!room.isValid){
      return res.status(403).json({message:'sending messages is not allowed!'
      });
    }

    const sender = req.user;
    const _id = new mongoose.Types.ObjectId().toString();
    const content = xss(message || '');
    const timestamp = new Date();
    const senderIdStr = String(sender._id);

    const senderEntry = onlineUsers.get(senderIdStr);
    const senderSocketId = senderEntry?.socketId || null;

    let taggedUser = null;
    if (content) {
      const match = content.match(/@([a-zA-Z0-9_.-]+)/);
      if (match) {
        const username = match[1].toLowerCase();
        const user = await userCacheClient.getUserByUsername(username);
        if (user && String(user._id) !== senderIdStr) {
          taggedUser = user._id;
        }
      }
    }

    const messageData = {
      _id,
      content,
      senderId: senderIdStr,
      isSystemMessage: isSystemMessage || false,
      systemType: systemType || null,
      roomId,
      receiverId: null,
      media: media || null,
      timestamp,
      taggedUser,
    };

    const payload = {
      _id,
      roomId,
      userId: senderIdStr,
      username: sender.username,
      text: content,
      isSystemMessage: isSystemMessage || false,
      systemType: systemType || null,
      timestamp,
      gender: sender.gender,
      avatar: sender.avatar,
      isOnline: sender.isOnline,
      lastSeen: sender.lastSeen,
      media: media?_addQualities(media):null,
      taggedUser,
    };

    enqueueMessage(messageData);
    emitNewMessage(roomId, payload, senderSocketId);

    messageCacheClient
      .appendRoomMessage(roomId, messageData)
      .catch(err =>
        console.error('[sendRoomMessage] cache append error:', err.message)
      );

    return res.status(201).json(messageData);
  } catch (err) {
    console.error('[sendRoomMessage] error:', err);
    return res.status(500).json({ message: err.message });
  }
}
