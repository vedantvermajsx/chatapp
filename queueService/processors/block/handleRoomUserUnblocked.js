import RoomBlock from '../../models/roomBlock.model.js';

export async function handleRoomUserUnblocked({ roomId, userId }) {
  await RoomBlock.deleteOne({ roomId, userId });
}
