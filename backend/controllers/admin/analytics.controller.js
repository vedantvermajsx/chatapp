import User from '../../models/user.model.js';
import Guest from '../../models/guest.model.js';
import Room from '../../models/room.model.js';
import Message from '../../models/message.model.js';

const DAY = 24 * 60 * 60 * 1000;
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function dailySeries(Model, field, since, days = 30) {
  const rows = await Model.aggregate([
    { $match: { [field]: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: TZ } },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map(rows.map((r) => [r._id, r.count]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dayKey(d);
    series.push({ date: key, count: map.get(key) || 0 });
  }
  return series;
}

export async function getOverview(req, res) {
  try {
    const now = Date.now();
    const since24 = new Date(now - DAY);
    const since7 = new Date(now - 7 * DAY);
    const since30 = new Date(now - 30 * DAY);

    const [
      users, guests, rooms, messages,
      onlineUsers, onlineGuests,
      dau, wau, mau,
      newUsers, newGuests, signupsToday,
      registrationsSeries, guestSeries, messagesSeries,
      genderRows, topRoomRows,
    ] = await Promise.all([
      User.estimatedDocumentCount(),
      Guest.estimatedDocumentCount(),
      Room.countDocuments({ isDeleted: false }),
      Message.estimatedDocumentCount(),
      User.countDocuments({ isOnline: true }),
      Guest.countDocuments({ isOnline: true }),
      User.countDocuments({ lastSeen: { $gte: since24 } }),
      User.countDocuments({ lastSeen: { $gte: since7 } }),
      User.countDocuments({ lastSeen: { $gte: since30 } }),
      User.countDocuments({ createdAt: { $gte: since30 } }),
      Guest.countDocuments({ createdAt: { $gte: since30 } }),
      User.countDocuments({ createdAt: { $gte: startOfToday() } }),
      dailySeries(User, 'createdAt', since30),
      dailySeries(Guest, 'createdAt', since30),
      dailySeries(Message, 'timestamp', since30),
      User.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]),
      Room.aggregate([
        { $match: { isDeleted: false } },
        { $project: { groupName: 1, groupPic: 1, memberCount: { $size: '$groupMembers' } } },
        { $sort: { memberCount: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const genderBreakdown = { male: 0, female: 0, other: 0 };
    for (const g of genderRows) {
      if (g._id === 0) genderBreakdown.male += g.count;
      else if (g._id === 1) genderBreakdown.female += g.count;
      else genderBreakdown.other += g.count;
    }

    const msgRoomRows = await Message.aggregate([
      { $match: { roomId: { $ne: null } } },
      { $group: { _id: '$roomId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const roomDocs = await Room.find(
      { _id: { $in: msgRoomRows.map((r) => r._id) } },
      'groupName groupPic'
    ).lean();
    const roomMap = new Map(roomDocs.map((r) => [String(r._id), r]));

    res.json({
      totals: { users, guests, rooms, messages },
      online: { users: onlineUsers, guests: onlineGuests, total: onlineUsers + onlineGuests },
      activity: { dau, wau, mau },
      registrations: { today: signupsToday, month: newUsers, guestsMonth: newGuests },
      series: { registrations: registrationsSeries, guests: guestSeries, messages: messagesSeries },
      genderBreakdown,
      topRoomsByMembers: topRoomRows.map((r) => ({
        roomId: r._id,
        groupName: r.groupName,
        groupPic: r.groupPic,
        count: r.memberCount,
      })),
      topRoomsByMessages: msgRoomRows.map((r) => ({
        roomId: r._id,
        groupName: roomMap.get(String(r._id))?.groupName || 'Unknown room',
        groupPic: roomMap.get(String(r._id))?.groupPic || null,
        count: r.count,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[admin/overview] error:', err.message);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
}

export async function getUsers(req, res) {
  try {
    const { search = '', page = 0, limit = 25, filter = 'all' } = req.query;
    const pageNum = Math.max(0, parseInt(page, 10) || 0);
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const query = {};
    const term = String(search).trim();
    if (term) {
      const rx = new RegExp(escapeRegex(term), 'i');
      query.$or = [{ username: rx }, { email: rx }];
    }
    if (filter === 'online') query.isOnline = true;
    if (filter === 'admin') query.role = 'admin';

    const [users, total] = await Promise.all([
      User.find(query, 'username email avatar gender role isOnline lastSeen createdAt')
        .sort({ lastSeen: -1 })
        .skip(pageNum * lim)
        .limit(lim)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({ users, total, page: pageNum, limit: lim, hasMore: (pageNum + 1) * lim < total });
  } catch (err) {
    console.error('[admin/users] error:', err.message);
    res.status(500).json({ message: 'Failed to load users' });
  }
}

export async function getGuests(req, res) {
  try {
    const { search = '', page = 0, limit = 25 } = req.query;
    const pageNum = Math.max(0, parseInt(page, 10) || 0);
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const query = {};
    const term = String(search).trim();
    if (term) query.username = new RegExp(escapeRegex(term), 'i');

    const [guests, total] = await Promise.all([
      Guest.find(query, 'username avatar gender isOnline lastSeen createdAt')
        .sort({ lastSeen: -1 })
        .skip(pageNum * lim)
        .limit(lim)
        .lean(),
      Guest.countDocuments(query),
    ]);

    res.json({ guests, total, page: pageNum, limit: lim, hasMore: (pageNum + 1) * lim < total });
  } catch (err) {
    console.error('[admin/guests] error:', err.message);
    res.status(500).json({ message: 'Failed to load guests' });
  }
}

export async function getUserDetail(req, res) {
  try {
    const { userId } = req.params;
    const isGuest = String(userId).startsWith('guest_');
    const Model = isGuest ? Guest : User;

    const user = await Model.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    delete user.password;
    delete user.privateKeyEncrypted;
    delete user.keySalt;

    const [messagesSent, roomsJoined, lastMessage] = await Promise.all([
      Message.countDocuments({ senderId: userId }),
      Room.countDocuments({ groupMembers: userId, isDeleted: false }),
      Message.findOne({ senderId: userId }, 'timestamp roomId receiverId').sort({ timestamp: -1 }).lean(),
    ]);

    res.json({
      user,
      stats: {
        type: isGuest ? 'guest' : 'user',
        messagesSent,
        roomsJoined,
        lastMessageAt: lastMessage?.timestamp || null,
        accountAgeDays: Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / DAY)),
      },
    });
  } catch (err) {
    console.error('[admin/user-detail] error:', err.message);
    res.status(500).json({ message: 'Failed to load user' });
  }
}

export async function getRooms(req, res) {
  try {
    const { search = '', page = 0, limit = 25 } = req.query;
    const pageNum = Math.max(0, parseInt(page, 10) || 0);
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

    const query = { isDeleted: false };
    const term = String(search).trim();
    if (term) query.groupName = new RegExp(escapeRegex(term), 'i');

    const [rooms, total] = await Promise.all([
      Room.aggregate([
        { $match: query },
        { $addFields: { memberCount: { $size: '$groupMembers' } } },
        { $sort: { memberCount: -1, createdAt: -1 } },
        { $skip: pageNum * lim },
        { $limit: lim },
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

    const adminIds = [...new Set(rooms.map((r) => r.groupAdmin).filter(Boolean))];
    const [adminUsers, adminGuests] = await Promise.all([
      User.find({ _id: { $in: adminIds } }, 'username').lean(),
      Guest.find({ _id: { $in: adminIds } }, 'username').lean(),
    ]);
    const nameMap = new Map(
      [...adminUsers, ...adminGuests].map((u) => [String(u._id), u.username])
    );

    res.json({
      rooms: rooms.map((r) => ({ ...r, adminUsername: nameMap.get(String(r.groupAdmin)) || null })),
      total,
      page: pageNum,
      limit: lim,
      hasMore: (pageNum + 1) * lim < total,
    });
  } catch (err) {
    console.error('[admin/rooms] error:', err.message);
    res.status(500).json({ message: 'Failed to load rooms' });
  }
}
