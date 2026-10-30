import Message from '../../models/message.model.js';
import Room from '../../models/room.model.js';

export async function getTopRoomsByMessages(limit = 5) {
  const rows = await Message.aggregate([
    { $match: { roomId: { $ne: null } } },
    { $group: { _id: '$roomId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);

  const rooms = await Room.find(
    { _id: { $in: rows.map((row) => row._id) } },
    'groupName groupPic'
  ).lean();
  const roomMap = new Map(rooms.map((room) => [String(room._id), room]));

  return rows.map((row) => {
    const room = roomMap.get(String(row._id));
    return {
      roomId: row._id,
      groupName: room?.groupName || 'Unknown room',
      groupPic: room?.groupPic || null,
      count: row.count,
    };
  });
}
