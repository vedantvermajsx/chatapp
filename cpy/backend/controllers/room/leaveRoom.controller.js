import Room from '../../models/room.model.js';
import Message from '../../models/message.model.js';
import emitUserLeftRoom from '../../emitters/userLeftRoom.emitter.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
import { onlineUsers } from '../../socket.js';
import { v4 as uuidv4 } from 'uuid';

export async function leaveRoom(req, res) {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    const validCheck = await roomCacheClient.isValidRoomId(roomId);
    if (!validCheck || !validCheck.isValid) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const hasMember = await roomCacheClient.hasMember(roomId, userId);

    if (hasMember) {
      const result = await Room.updateOne(
        { _id: roomId },
        { $pull: { groupMembers: userId } }
      );

      if (result.matchedCount > 0) {
        await roomCacheClient.refreshRoomCache(roomId);
      }
    }

    // Build and persist the system message
    const msgId = uuidv4();
    const timestamp = new Date();
    const systemMessageData = {
      uuid: msgId,
      id: msgId,
      senderId: userId,
      roomId,
      receiverId: null,
      content: `${username} left the group`,
      isSystemMessage: true,
      systemType: 'member-left',
      timestamp,
    };

    Message.create({
      _id: msgId,
      senderId: userId,
      roomId,
      content: `${username} left the group`,
      isSystemMessage: true,
      systemType: 'member-left',
      timestamp,
    }).catch(err => console.error('[leaveRoom] Failed to save system message:', err));

    messageCacheClient.appendRoomMessage(roomId, systemMessageData).catch(err =>
      console.error('[leaveRoom] Failed to append system message to cache:', err)
    );

    // Get sender's socketId so the emitter can exclude them
    const senderSocketId = onlineUsers.get(userId)?.socketId ?? null;

    // Emit to all room members EXCEPT the sender themselves
    emitUserLeftRoom(roomId, { username, userId, roomId, msgId }, senderSocketId);

    res.json({ message: 'Left room successfully' });
  } catch (err) {
    console.error('leaveRoom error:', err);
    res.status(500).json({ message: err.message });
  }
}
