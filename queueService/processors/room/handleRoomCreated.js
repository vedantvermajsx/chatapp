import mongoose from 'mongoose';
import Room from '../../models/room.model.js';
import UserRoom from '../../models/userRoom.model.js';
import { handleMemberJoined } from './handleMemberJoined.js';

export async function handleRoomCreated({ room, creatorId }) {
  try {
    await Room.create({
      ...room,
      _id: new mongoose.Types.ObjectId(room._id),
    });
    console.log(`[RoomProcessor] created room ${room._id} (${room.groupName})`);
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`[RoomProcessor] duplicate room ignored: ${room.groupName}`);
      return;
    }
    console.error(`[RoomProcessor] failed to create room ${room._id}:`, err.message);
    throw err;
  }

  try {
    await UserRoom.findOneAndUpdate(
      { userId: creatorId },
      { $addToSet: { roomIds: room._id } },
      { upsert: true }
    );
    console.log(`[RoomProcessor] added room ${room._id} to UserRoom for creator ${creatorId}`);
  } catch (err) {
    console.error(`[RoomProcessor] failed to update UserRoom for creator ${creatorId}:`, err.message);
  }
}
