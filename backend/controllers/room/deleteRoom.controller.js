import mongoose from 'mongoose';
import emitRoomDeleted from '../../emitters/roomDeleted.emitter.js';
import emitNewMessage from '../../emitters/newMessage.emitter.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import { enqueueMessage, enqueueRoomDeletion } from '../../utils/queueClient.js';

export async function deleteRoom(req, res) {
  try {
    const { roomId } = req.params;

    const room = await roomCacheClient.getRoomById(roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (room.groupAdmin !== req.user._id) {
      return res.status(403).json({ message: 'Only admin can delete room' });
    }

    const _id = new mongoose.Types.ObjectId();
    const content = `${req.user.username} deleted the group`;
    const timestamp = new Date();

    const messageData = {
      _id,
      content,
      senderId: req.user._id,
      isSystemMessage: true,
      systemType: 'room-deleted',
      roomId,
      receiverId: null,
      media: null,
      timestamp,
    };

    const payload = {
      _id: _id.toString(),
      roomId,
      userId: req.user._id,
      username: req.user.username,
      text: content,
      isSystemMessage: true,
      systemType: 'room-deleted',
      timestamp,
      gender: req.user.gender,
      avatar: req.user.avatar,
      media: null,
    };

    enqueueMessage(messageData);
    await messageCacheClient.appendRoomMessage(roomId, messageData);
    emitNewMessage(roomId, payload);

    await roomCacheClient.markRoomDeleted(roomId);

    res.json({ message: 'Room deleted' });

    emitRoomDeleted({ roomId });
    enqueueRoomDeletion(roomId);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
