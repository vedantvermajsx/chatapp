import Message from '../../models/message.model.js';
import UserRoom from '../../models/userRoom.model.js';
import RoomMessageRead from '../../models/roomMessageRead.model.js';
import ConversationRead from '../../models/conversationRead.model.js';
import Room from '../../models/room.model.js';
import unreadCacheClient from '../../database/unreadCacheClient.js';

/**
 * GET /rooms/unread
 *
 * Fast path  (cache warm):  read from UnreadCacheService — single HTTP call, O(1)
 * Cold path  (first load):  aggregate from MongoDB, then seed the cache
 *
 * Returns: { "room_<id>": N, "private_<userId>": N }
 */
export async function getUnreadCounts(req, res) {
  try {
    const userId = req.user.id;

    // ── 1. Try cache first ───────────────────────────────────────────────────
    const cached = await unreadCacheClient.getAll(userId);
    if (!cached.cold) {
      return res.json(cached.counts);
    }

    // ── 2. Cache cold — compute from MongoDB and seed ────────────────────────
    const result = await _computeFromDB(userId);

    // Seed asynchronously — don't block the response
    unreadCacheClient.seed(userId, result).catch(() => {});

    return res.json(result);
  } catch (err) {
    console.error('[getUnreadCounts] error:', err);
    res.status(500).json({ message: err.message });
  }
}

async function _computeFromDB(userId) {
  const result = {};

  // ── Room unread ──────────────────────────────────────────────────────────
  let userRoom = await UserRoom.findOne({ userId }).lean();
  let roomIds = userRoom?.roomIds ?? null;

  if (!roomIds) {
    const rooms = await Room.find({ groupMembers: userId }, '_id').lean();
    roomIds = rooms.map(r => String(r._id));
    if (roomIds.length > 0) {
      await UserRoom.findOneAndUpdate(
        { userId },
        { $set: { roomIds } },
        { upsert: true }
      );
    }
  }

  if (roomIds.length > 0) {
    // All read receipts in one query
    const readRecords = await RoomMessageRead.find({
      userId,
      roomId: { $in: roomIds }
    }).lean();

    const readMap = {};
    readRecords.forEach(r => { readMap[r.roomId] = r.lastReadAt; });

    // Single aggregate across ALL rooms using $facet — one round-trip to MongoDB
    const pipeline = [
      {
        $match: {
          roomId: { $in: roomIds },
          senderId: { $ne: userId },
          isSystemMessage: { $ne: true }
        }
      },
      {
        $addFields: {
          lastReadAt: {
            $arrayElemAt: [
              {
                $map: {
                  input: readRecords,
                  as: 'r',
                  in: {
                    $cond: [{ $eq: ['$$r.roomId', '$roomId'] }, '$$r.lastReadAt', null]
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $match: {
          $expr: {
            $or: [
              { $eq: [{ $ifNull: ['$lastReadAt', null] }, null] },
              { $gt: ['$timestamp', '$lastReadAt'] }
            ]
          }
        }
      },
      {
        $group: {
          _id: '$roomId',
          count: { $sum: 1 }
        }
      }
    ];

    const roomCounts = await Message.aggregate(pipeline);
    roomCounts.forEach(({ _id, count }) => {
      if (count > 0) result[`room_${_id}`] = count;
    });
  }

  // ── Private unread ───────────────────────────────────────────────────────
  // One aggregate: group by sender, count messages after lastSeenAt
  const readRecords = await ConversationRead.find({ receiverId: userId }).lean();
  const readMap = {};
  readRecords.forEach(r => { readMap[r.senderId] = r.lastSeenAt; });

  const privatePipeline = [
    {
      $match: {
        receiverId: userId,
        roomId: null,
        isSystemMessage: { $ne: true }
      }
    },
    {
      $addFields: {
        lastSeenAt: {
          $let: {
            vars: {
              record: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: readRecords,
                      as: 'r',
                      cond: { $eq: ['$$r.senderId', '$senderId'] }
                    }
                  },
                  0
                ]
              }
            },
            in: '$$record.lastSeenAt'
          }
        }
      }
    },
    {
      $match: {
        $expr: {
          $or: [
            { $eq: [{ $ifNull: ['$lastSeenAt', null] }, null] },
            { $gt: ['$timestamp', '$lastSeenAt'] }
          ]
        }
      }
    },
    {
      $group: {
        _id: '$senderId',
        count: { $sum: 1 }
      }
    }
  ];

  const privateCounts = await Message.aggregate(privatePipeline);
  privateCounts.forEach(({ _id, count }) => {
    if (count > 0) result[`private_${_id}`] = count;
  });

  return result;
}
