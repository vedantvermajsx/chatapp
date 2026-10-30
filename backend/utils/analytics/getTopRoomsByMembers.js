import Room from '../../models/room.model.js';

export async function getTopRoomsByMembers(limit = 5) {
  const rows = await Room.aggregate([
    { $match: { isDeleted: false } },
    { $project: { groupName: 1, groupPic: 1, memberCount: { $size: '$groupMembers' } } },
    { $sort: { memberCount: -1 } },
    { $limit: limit },
  ]);

  return rows.map((row) => ({
    roomId: row._id,
    groupName: row.groupName,
    groupPic: row.groupPic,
    count: row.memberCount,
  }));
}
