import RoomMessageRead from '../models/roomMessageRead.model.js';
import Message from '../models/message.model.js';
import { activeRooms } from '../socket.js';
import unreadCacheClient from '../database/unreadCacheClient.js';

/**
 * Socket event: markRoomRead
 * Payload: { roomId, messageId?, timestamp? }
 *
 * Called by the frontend when:
 *   1. User opens a room
 *   2. A new message arrives and the room is currently active
 */
const handleMarkRoomRead = (socket) => async ({ roomId, messageId, timestamp }) => {
  if (!roomId) return;

  const userId = socket.user._id || socket.user.id;

  // Track which room this user is actively viewing
  activeRooms.set(String(userId), String(roomId));

  try {
    let lastReadAt;

    if (timestamp) {
      lastReadAt = new Date(timestamp);
    } else if (messageId) {
      const msg = await Message.findById(messageId, 'timestamp').lean();
      lastReadAt = msg?.timestamp ?? new Date();
    } else {
      lastReadAt = new Date();
    }

    // Update persistent read receipt
    await RoomMessageRead.findOneAndUpdate(
      { userId, roomId },
      { $set: { lastReadMessageId: messageId ?? null, lastReadAt } },
      { upsert: true, new: true }
    );

    // Clear the unread badge in cache immediately — O(1)
    await unreadCacheClient.reset(userId, `room_${roomId}`);

    socket.emit('roomReadAck', { roomId });
  } catch (err) {
    console.error('[markRoomRead] error:', err);
  }
};

export default handleMarkRoomRead;
