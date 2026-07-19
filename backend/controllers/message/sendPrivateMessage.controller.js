import mongoose from 'mongoose';
import xss from 'xss';
import emitNewPrivateMessage from '../../emitters/newPrivateMessage.emitter.js';
import { enqueueMessage } from '../../utils/queueClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import { _addQualities } from '../../utils/addQualities.js';

export async function sendPrivateMessage(req, res) {
  try {
    const { receiverId, content, media, isSystemMessage, systemType } = req.body;

    if (!receiverId) {
      return res.status(400).json({ message: 'receiverId required' });
    }

    const sender = req.user;

    if (String(sender._id) === String(receiverId)) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const _id = new mongoose.Types.ObjectId().toString();
    const sanitizedContent = xss(content || '');
    const timestamp = new Date();
    const senderIdStr = String(sender._id);
    const receiverIdStr = String(receiverId);

    const messageData = {
      _id,
      content: sanitizedContent,
      senderId: senderIdStr,
      receiverId: receiverIdStr,
      roomId: null,
      media: media || null,
      timestamp,
      status: 'sent',
      isSystemMessage: isSystemMessage || false,
      systemType: systemType || null,
    };

    const payload = {
      _id,
      senderId: senderIdStr,
      senderUsername: sender.username,
      username: sender.username,
      receiverId: receiverIdStr,
      content: sanitizedContent,
      timestamp,
      gender: sender.gender,
      avatar: sender.avatar,
      isOnline: sender.isOnline,
      lastSeen: sender.lastSeen,
      media: media ? _addQualities(media) : null,
      isSystemMessage: isSystemMessage || false,
      systemType: systemType || null,
    };

    enqueueMessage(messageData);

    emitNewPrivateMessage(senderIdStr, receiverIdStr, payload);

    messageCacheClient
      .appendPrivateMessage(senderIdStr, receiverIdStr, messageData)
      .catch(err =>
        console.error('[sendPrivateMessage] cache append error:', err.message)
      );

    return res.json(messageData);
  } catch (err) {
    console.error('[sendPrivateMessage] error:', err);
    return res.status(500).json({ message: err.message });
  }
}
