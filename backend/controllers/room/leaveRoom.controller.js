import Room from '../../models/room.model.js';
import UserRoom from '../../models/userRoom.model.js';
import RoomMessageRead from '../../models/roomMessageRead.model.js';
import emitNewMessage from '../../emitters/newMessage.emitter.js';
import { enqueueMessage } from '../../utils/queueClient.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import { messageCacheClient } from '../../database/messageCacheClient.js';
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

        // Keep UserRoom index in sync
        await UserRoom.findOneAndUpdate(
          { userId },
          { $pull: { roomIds: roomId } }
        );

        // Remove read receipt — no longer a member
        await RoomMessageRead.deleteOne({ userId, roomId });
      }
    }

    // Build system message the same way sendRoomMessage does
    const uuid = uuidv4();
    const content = `${username} left the group`;
    const timestamp = new Date();

    const messageData = {
      uuid,
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
      id: uuid,
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
    emitNewMessage(roomId, payload);
    await messageCacheClient.appendRoomMessage(roomId, messageData);

    res.json({ message: 'Left room successfully' });
  } catch (err) {
    console.error('leaveRoom error:', err);
    res.status(500).json({ message: err.message });
  }
}
