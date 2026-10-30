import Room from '../../models/room.model.js';
import { escapeRegex } from '../../utils/escapeRegex.js';
import { parsePagination } from '../../utils/analytics/parsePagination.js';
import { getRoomAdminNames } from '../../utils/analytics/getRoomAdminNames.js';

export async function getRooms(req, res) {
  try {
    const { search = '' } = req.query;
    const { page, limit } = parsePagination(req.query);

    const query = { isDeleted: false };
    const term = String(search).trim();
    if (term) query.groupName = new RegExp(escapeRegex(term), 'i');

    const [rooms, total] = await Promise.all([
      Room.aggregate([
        { $match: query },
        { $addFields: { memberCount: { $size: '$groupMembers' } } },
        { $sort: { memberCount: -1, createdAt: -1 } },
        { $skip: page * limit },
        { $limit: limit },
        {
          $project: {
            groupName: 1,
            groupDescription: 1,
            groupPic: 1,
            groupAdmin: 1,
            memberCount: 1,
            createdAt: 1,
          },
        },
      ]),
      Room.countDocuments(query),
    ]);

    const nameMap = await getRoomAdminNames(rooms.map((room) => room.groupAdmin));

    res.json({
      rooms: rooms.map((room) => ({
        ...room,
        adminUsername: nameMap.get(String(room.groupAdmin)) || null,
      })),
      total,
      page,
      limit,
      hasMore: (page + 1) * limit < total,
    });
  } catch (err) {
    console.error('[admin/rooms] error:', err.message);
    res.status(500).json({ message: 'Failed to load rooms' });
  }
}
