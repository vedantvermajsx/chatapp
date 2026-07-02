import Room from '../../models/room.model.js';

export async function handleRoomDeleted({ roomId }) {
  try {
    await Room.findByIdAndUpdate(roomId, { isDeleted: true });
    console.log(`[RoomProcessor] marked room ${roomId} as deleted in MongoDB`);
  } catch (err) {
    console.error(`[RoomProcessor] failed to mark room ${roomId} as deleted:`, err.message);
  }
}