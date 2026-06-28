import UnreadCacheService from '../../services/UnreadCacheService.js';
import Message from '../../models/message.model.js';
import Room from '../../models/room.model.js';
import UserRoom from '../../models/userRoom.model.js';
import RoomMessageRead from '../../models/roomMessageRead.model.js';
import ConversationRead from '../../models/conversationRead.model.js';

// ── Cold-path: compute unread counts from MongoDB ─────────────────────────────
// Runs inside cacheService — backend never touches Mongo for this.

async function computeFromDB(userId) {
  const result = {};

  // ── Room unread ─────────────────────────────────────────────────────────────
  let userRoom = await UserRoom.findOne({ userId }).lean();
  let roomIds = userRoom?.roomIds?.map(String) ?? null;

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

  if (roomIds && roomIds.length > 0) {
    const readRecords = await RoomMessageRead.find({
      userId,
      roomId: { $in: roomIds }
    }).lean();

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
      { $group: { _id: '$roomId', count: { $sum: 1 } } }
    ];

    const roomCounts = await Message.aggregate(pipeline);
    roomCounts.forEach(({ _id, count }) => {
      if (count > 0) result[`room_${_id}`] = count;
    });
  }

  // ── Private unread ──────────────────────────────────────────────────────────
  const readRecords = await ConversationRead.find({ receiverId: userId }).lean();

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
    { $group: { _id: '$senderId', count: { $sum: 1 } } }
  ];

  const privateCounts = await Message.aggregate(privatePipeline);
  privateCounts.forEach(({ _id, count }) => {
    if (count > 0) result[`private_${_id}`] = count;
  });

  return result;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /unread/:userId
 *
 * Cache hit  → return immediately (O(1))
 * Cache cold → compute from Mongo, seed cache, return result
 *
 * Backend receives warm data either way — never falls back to Mongo itself.
 */
export const getUnread = async (req, res) => {
  const { userId } = req.params;
  try {
    const cached = UnreadCacheService.getAll(userId);

    if (cached !== null) {
      return res.json({ cold: false, counts: cached });
    }

    // Cold — compute inside cacheService, seed, return
    const counts = await computeFromDB(userId);
    UnreadCacheService.seed(userId, counts); // sync seed before responding
    res.json({ cold: false, counts });
  } catch (err) {
    console.error('[unread.controller] getUnread error:', err);
    res.status(500).json({ error: err.message });
  }
};

/** POST /unread/:userId/increment  — body: { chatKey } */
export const incrementUnread = (req, res) => {
  const { userId } = req.params;
  const { chatKey } = req.body;
  if (!chatKey) return res.status(400).json({ message: 'chatKey required' });
  UnreadCacheService.increment(userId, chatKey);
  res.json({ ok: true });
};

/** POST /unread/members/increment  — body: { memberIds, senderId, chatKey } */
export const incrementUnreadForMembers = (req, res) => {
  const { memberIds, senderId, chatKey } = req.body;
  if (!memberIds?.length || !chatKey) return res.status(400).json({ message: 'memberIds and chatKey required' });
  UnreadCacheService.incrementForMembers(memberIds, senderId, chatKey);
  res.json({ ok: true });
};

/** POST /unread/:userId/reset  — body: { chatKey } */
export const resetUnread = (req, res) => {
  const { userId } = req.params;
  const { chatKey } = req.body;
  if (!chatKey) return res.status(400).json({ message: 'chatKey required' });
  UnreadCacheService.reset(userId, chatKey);
  res.json({ ok: true });
};

/** POST /unread/:userId/seed  — body: { counts } — only seeds if cache is cold */
export const seedUnread = (req, res) => {
  const { userId } = req.params;
  const { counts } = req.body;
  if (!counts) return res.status(400).json({ message: 'counts required' });
  UnreadCacheService.seed(userId, counts);
  res.json({ ok: true });
};

/** DELETE /unread/:userId  — invalidate (force recompute from DB next read) */
export const invalidateUnread = (req, res) => {
  const { userId } = req.params;
  UnreadCacheService.invalidate(userId);
  res.json({ ok: true });
};
