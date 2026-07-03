import mongoose from 'mongoose';
import emitNewMessage from '../../emitters/newMessage.emitter.js';
import emitUserLeftRoom from '../../emitters/userLeftRoom.emitter.js';
import { enqueueMessage, enqueueRoomMemberLeft } from '../../utils/queueClient.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';

export async function leaveRoom(req, res) {
  try {
    const { roomId } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    const validCheck = await roomCacheClient.isValidRoomId(roomId);
   
    
    if (!validCheck) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = await roomCacheClient.getRoomById(roomId);

    if (room.groupAdmin === userId) {
      return res.status(403).json({ message: "admin cannot leave the group.", success: true });
    }

    const hasMember = await roomCacheClient.hasMember(roomId, userId);
    
    if (hasMember) {
      roomCacheClient.removeRoomMember(roomId, userId).catch(() => {});
      enqueueRoomMemberLeft(roomId, userId);
    }

    if (!room.isDeleted) {
      const _id = new mongoose.Types.ObjectId();
      const content = `${username} left the group`;
      const timestamp = new Date();

      const messageData = {
        _id,
        content,
        senderId: userId,
        isSystemMessage: true,
        systemType: 'member-left',
        roomId,
        receiverId: null,
        media: null,
        timestamp,
      };

      const payload = {
        _id: _id.toString(),
        roomId,
        userId,
        username,
        text: content,
        isSystemMessage: true,
        systemType: 'member-left',
        timestamp,
        gender: req.user.gender,
        avatar: req.user.avatar,
        media: null,
      };

      enqueueMessage(messageData);

      await messageCacheClient.appendRoomMessage(roomId, messageData);

      emitNewMessage(roomId, payload);
    }

    emitUserLeftRoom(roomId, {
      roomId,
      userId,
      username,
      avatar: req.user.avatar,
      gender: req.user.gender,
      role: req.user.role,
    });

    return res.json({ message: 'Left room successfully' });
  } catch (err) {
    console.error('[leaveRoom] error:', err);
    return res.status(500).json({ message: err.message });
  }
}