import Room from '../../models/room.model.js';
import emitNewMessage from '../../emitters/newMessage.emitter.js';
import { enqueueMessage } from '../../utils/queueClient.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import { v4 as uuidv4 } from 'uuid';

export async function joinRoom(req, res) {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    const validCheck = await roomCacheClient.isValidRoomId(roomId);
    if (!validCheck || !validCheck.isValid) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const hasMember = await roomCacheClient.hasMember(roomId, userId);

    if (!hasMember) {
      const result = await Room.updateOne(
        { _id: roomId },
        { $addToSet: { groupMembers: userId } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Room not found' });
      }

      await roomCacheClient.refreshRoomCache(roomId);

      // Build system message the same way sendRoomMessage does
      const uuid = uuidv4();
      const content = `${username} joined the group`;
      const timestamp = new Date();

      const messageData = {
        uuid,
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
        id: uuid,
        roomId,
        userId,
        username,
        text: content,
        isSystemMessage: true,
        systemType: 'member-joined',
        timestamp,
        gender: req.user.gender,
        avatar: req.user.avatar,
        media: null,
      };

      enqueueMessage(messageData);
      emitNewMessage(roomId, payload);
      await messageCacheClient.appendRoomMessage(roomId, messageData);

      return res.status(200).json({ message: 'Joined room successfully' });
    }

    return res.json({ alreadyMember: true });
  } catch (err) {
    console.error('joinRoom error:', err);
    res.status(500).json({ message: err.message });
  }
}
