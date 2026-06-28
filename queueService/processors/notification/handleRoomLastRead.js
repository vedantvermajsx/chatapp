import RoomMessageRead from '../../models/roomMessageRead.model.js';

export async function handleRoomLastRead({ userId, roomId, messageId, lastReadAt }) {
  if (!userId || !roomId) return;

  try {
    await RoomMessageRead.findOneAndUpdate(
      { userId, roomId },
      { $set: { lastReadMessageId: messageId, lastReadAt: lastReadAt ?? new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[NotificationProcessor] room lastRead set error:', err.message);
  }
}
