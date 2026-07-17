import mongoose from 'mongoose';
import emitNewMessage from '../../emitters/newMessage.emitter.js';
import emitUserJoinedRoom from '../../emitters/userJoinedRoom.emitter.js';
import { enqueueMessage, enqueueRoomMemberJoined } from '../../utils/queueClient.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import unreadCacheClient from '../../database/unreadCacheClient.js';

export async function joinRoom(req, res) {
  try {
    const { roomId } = req.body;
    const userId = req.user._id;
    const username = req.user.username;

    const validCheck = await roomCacheClient.isValidRoomId(roomId);
    
    if (!validCheck || !validCheck.isValid) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const hasMember = await roomCacheClient.hasMember(roomId, userId);
    if (hasMember) {
      return res.json({ alreadyMember: true });
    }

    const roomData = await roomCacheClient.addRoomMember(roomId, userId);

    const _id = new mongoose.Types.ObjectId();
    const content = `${username} joined the group`;
    const timestamp = new Date();

    const messageData = {
      _id,
      content,
      senderId: userId,
      isSystemMessage: true,
      systemType: 'member-joined',
      roomId,
      receiverId: null,
      media: null,
      timestamp,
    };

    const payload = {
      _id: _id.toString(),
      roomId,
      userId,
      text: content,
      isSystemMessage: true,
      systemType: 'member-joined',
      timestamp,
    };

    unreadCacheClient.seedRoomOnJoin(userId, roomId);
    enqueueRoomMemberJoined(roomId, userId);
    enqueueMessage(messageData);
    emitNewMessage(roomId, payload);

    emitUserJoinedRoom(roomId, {
      roomId,
      userId,
      username,
      avatar: req.user.avatar,
      gender: req.user.gender,
      role: req.user.role,
    });

    
    await messageCacheClient.appendRoomMessage(roomId, messageData);

    return res.status(200).json({ message: 'Joined room successfully', room: roomData });
  } catch (err) {
    console.error('[joinRoom] error:', err);
    return res.status(500).json({ message: err.message });
  }
}
