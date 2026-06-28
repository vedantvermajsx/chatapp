import Message from '../../models/message.model.js';
import Room from '../../models/room.model.js';

export async function handleRoomDeleted({ roomId }) {
  try {
    await Promise.all([
      Room.findByIdAndDelete(roomId),
      Message.deleteMany({ roomId }),
    ]);
    console.log(`[RoomProcessor] deleted room ${roomId} and its messages from MongoDB`);
  } catch (err) {
    console.error(`[RoomProcessor] failed to delete room ${roomId}:`, err.message);
  }
}
