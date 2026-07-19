import roomCacheClient from '../../database/roomCacheClient.js';
import Room from '../../models/room.model.js';
import User from '../../models/user.model.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

async function getRoomMembersFromDB(roomId, skip, limit, search) {
  try {
    const room = await Room.findById(roomId);
    if (!room) return null;

    let memberIds = room.groupMembers || [];
    let query = { _id: { $in: memberIds } };

    if (search) {
      query.username = { $regex: new RegExp(search, 'i') };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query, '_id username avatar gender isOnline lastSeen')
      .sort({ isOnline: -1, lastSeen: -1 })
      .skip(skip)
      .limit(limit);

    return {
      members: users,
      total,
      hasMore: total > skip + users.length
    };
  } catch (err) {
    console.error('[getRoomMembers] DB error:', err.message);
    return null;
  }
}

export async function getRoomMembers(req, res) {
  try {
    const { roomId } = req.params;
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE)
    );
    const search = req.query.search || '';

    let page = null;
    try {
      page = await roomCacheClient.getRoomMembers(roomId, { skip, limit, search });
    } catch (cacheErr) {
      console.warn('[getRoomMembers] Cache error, falling back to DB:', cacheErr.message);
    }

    if (page === null) {
      page = await getRoomMembersFromDB(roomId, skip, limit, search);
    }

    if (page === null) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(page);
  } catch (err) {
    console.error('[getRoomMembers] Error:', err.message);
    res.status(500).json({ message: err.message });
  }
}