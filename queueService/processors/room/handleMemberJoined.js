import Room from '../../models/room.model.js';
import UserRoom from '../../models/userRoom.model.js';
import Message from '../../models/message.model.js';
import RoomMessageRead from '../../models/roomMessageRead.model.js';

export async function handleMemberJoined({ roomId, userId }) {
  const errors = [];

  try {
    await Room.updateOne({ _id: roomId }, { $addToSet: { groupMembers: String(userId) } });
  } catch (err) {
    console.error(`[RoomProcessor] failed to add member ${userId} to room ${roomId}:`, err.message);
    errors.push(err);
  }

  try {
    await UserRoom.findOneAndUpdate({ userId }, { $addToSet: { roomIds: roomId } }, { upsert: true });
  } catch (err) {
    if (err.code !== 11000) {
      console.error(`[RoomProcessor] failed to update UserRoom for user ${userId}:`, err.message);
      errors.push(err);
    }
  }

  try {
    const total = await Message.countDocuments({ roomId, isSystemMessage: { $ne: true } });
    await RoomMessageRead.findOneAndUpdate(
      { userId, roomId },
      { $setOnInsert: { readCount: total } },
      { upsert: true }
    );
  } catch (err) {
    if (err.code !== 11000) {
      console.error(`[RoomProcessor] failed to seed readCount for user ${userId} in room ${roomId}:`, err.message);
      errors.push(err);
    }
  }

  if (errors.length) throw errors[0];
}
