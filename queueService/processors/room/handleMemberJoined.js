import Room from '../../models/room.model.js';
import UserRoom from '../../models/userRoom.model.js';
import Message from '../../models/message.model.js';
import RoomMessageRead from '../../models/roomMessageRead.model.js';

export async function handleMemberJoined({ roomId, userId }) {
  try {
    await Room.updateOne(
      { _id: roomId },
      { $addToSet: { groupMembers: userId } }
    );
    console.log(`[RoomProcessor] added member ${userId} to room ${roomId}`);
  } catch (err) {
    console.error(`[RoomProcessor] failed to add member ${userId} to room ${roomId}:`, err.message);
  }

  try {
    await UserRoom.findOneAndUpdate(
      { userId },
      { $addToSet: { roomIds: roomId } },
      { upsert: true }
    );
  } catch (err) {
    console.error(`[RoomProcessor] failed to update UserRoom for user ${userId}:`, err.message);
  }

  try {
    const total = await Message.countDocuments({ roomId });
    await RoomMessageRead.findOneAndUpdate(
      { userId, roomId },
      { $setOnInsert: { readCount: total } },
      { upsert: true }
    );
  } catch (err) {
    console.error(`[RoomProcessor] failed to seed readCount for user ${userId} in room ${roomId}:`, err.message);
  }
}
