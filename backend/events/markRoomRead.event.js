import RoomMessageRead from '../models/roomMessageRead.model.js';
import Message from '../models/message.model.js';
import { activeRooms } from '../socket.js';
import unreadCacheClient from '../database/unreadCacheClient.js';
import lastReadCacheClient from '../database/lastReadCacheClient.js';
import { publish } from '../utils/messageBroker.js';

const handleMarkRoomRead = (socket) => async ({ roomId, messageId, timestamp }) => {
  if (!roomId) return;

  const userId = socket.user._id || socket.user.id;

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

    const existing = await RoomMessageRead.findOne({ userId, roomId })
      .select('lastReadAt')
      .lean();

    // Compare against the previously read message's *creation* time, not
    // when it was marked as seen — an older message arriving late should
    // never regress (or redundantly re-trigger) the read state.
    if (existing?.lastReadAt && lastReadAt <= existing.lastReadAt) {
      socket.emit('roomReadAck', { roomId });
      return;
    }

    await RoomMessageRead.findOneAndUpdate(
      { userId, roomId },
      { $set: { lastReadMessageId: messageId ?? null, lastReadAt } },
      { upsert: true, new: true }
    );

    await unreadCacheClient.reset(userId, `room_${roomId}`);
    lastReadCacheClient.setRoom(userId, roomId, { messageId: messageId ?? null, lastReadAt }).catch(() => {});

    publish('notification.lastread.room', {
      userId,
      roomId,
      messageId: messageId ?? null,
      lastReadAt: lastReadAt.toISOString(),
    });

    socket.emit('roomReadAck', { roomId });
  } catch (err) {
    console.error('[markRoomRead] error:', err);
  }
};

export default handleMarkRoomRead;
