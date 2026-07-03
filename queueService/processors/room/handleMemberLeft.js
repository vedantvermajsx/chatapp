import Room from '../../models/room.model.js';
import Message from '../../models/message.model.js';
import RoomMessageRead from '../../models/roomMessageRead.model.js';
import UserRoom from '../../models/userRoom.model.js';

export async function handleMemberLeft({ roomId, userId }) {
  let updatedRoom = null;
  try {
    updatedRoom = await Room.findOneAndUpdate(
      { _id: roomId },
      { $pull: { groupMembers: userId } },
      { new: true }
    ).lean();
    console.log(`[RoomProcessor] removed member ${userId} from room ${roomId}`);
  } catch (err) {
    console.error(`[RoomProcessor] failed to remove member ${userId} from room ${roomId}:`, err.message);
  }

  try {
    await UserRoom.findOneAndUpdate(
      { userId },
      { $pull: { roomIds: roomId } }
    );
  } catch (err) {
    console.error(`[RoomProcessor] failed to update UserRoom for user ${userId}:`, err.message);
  }

  try {
    await RoomMessageRead.deleteOne({ userId, roomId });
  } catch (err) {
    console.error(`[RoomProcessor] failed to delete RoomMessageRead for user ${userId}:`, err.message);
  }

  if (updatedRoom && updatedRoom.isDeleted && (updatedRoom.groupMembers?.length ?? 0) === 0) {
    try {
      await Message.deleteMany({ roomId });
      await RoomMessageRead.deleteMany({ roomId });
      await Room.deleteOne({ _id: roomId });
      console.log(`[RoomProcessor] purged deleted room ${roomId} after last member left`);
    } catch (err) {
      console.error(`[RoomProcessor] failed to purge deleted room ${roomId}:`, err.message);
    }
  }
}
