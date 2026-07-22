import Message from '../../models/message.model.js';
import Room from '../../models/room.model.js';
import UserRoom from '../../models/userRoom.model.js';
import ConversationRead from '../../models/conversationRead.model.js';
import { readStateCache } from '../../services/CacheService.js';

export async function getUserRoomIds(userId) {
  const cacheKey = `userRooms:${userId}`;
  const cached = readStateCache.get(cacheKey);
  if (cached) return cached;

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

  const result = roomIds ?? [];
  readStateCache.set(cacheKey, result, 6000);
  return result;
}

export async function computePrivateFromDB(userId) {
  const result = {};

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
