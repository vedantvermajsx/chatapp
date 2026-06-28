import Room from "../../models/room.model.js";
import RoomMessageRead from "../../models/roomMessageRead.model.js";
import UserRoom from "../../models/userRoom.model.js";

export async function handleMemberLeft({ roomId, userId }) {
  try {
    await Room.updateOne(
      { _id: roomId },
      { $pull: { groupMembers: userId } },
    );
    console.log(`[RoomProcessor] removed member ${userId} from room ${roomId}`);
  } catch (err) {
    console.error(
      `[RoomProcessor] failed to remove member ${userId} from room ${roomId}:`,
      err.message,
    );
  }

  try {
    await UserRoom.findOneAndUpdate(
      { userId },
      { $pull: { roomIds: roomId } },
    );
  } catch (err) {
    console.error(
      `[RoomProcessor] failed to update UserRoom for user ${userId}:`,
      err.message,
    );
  }

  try {
    await RoomMessageRead.deleteOne({ userId, roomId });
  } catch (err) {
    console.error(
      `[RoomProcessor] failed to delete RoomMessageRead for user ${userId}:`,
      err.message,
    );
  }
}