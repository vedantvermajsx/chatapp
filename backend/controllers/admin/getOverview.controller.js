import User from '../../models/user.model.js';
import Guest from '../../models/guest.model.js';
import Room from '../../models/room.model.js';
import Message from '../../models/message.model.js';
import { DAY_MS } from '../../utils/analytics/constants.js';
import { dailySeries } from '../../utils/analytics/dailySeries.js';
import { startOfToday } from '../../utils/analytics/startOfToday.js';
import { getGenderBreakdown } from '../../utils/analytics/getGenderBreakdown.js';
import { getTopRoomsByMembers } from '../../utils/analytics/getTopRoomsByMembers.js';
import { getTopRoomsByMessages } from '../../utils/analytics/getTopRoomsByMessages.js';

export async function getOverview(req, res) {
  try {
    const now = Date.now();
    const since24 = new Date(now - DAY_MS);
    const since7 = new Date(now - 7 * DAY_MS);
    const since30 = new Date(now - 30 * DAY_MS);

    const [
      users, guests, rooms, messages,
      onlineUsers, onlineGuests,
      dau, wau, mau,
      newUsers, newGuests, signupsToday,
      registrationsSeries, guestSeries, messagesSeries,
      genderBreakdown, topRoomsByMembers, topRoomsByMessages,
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
      getGenderBreakdown(),
      getTopRoomsByMembers(),
      getTopRoomsByMessages(),
    ]);

    res.json({
      totals: { users, guests, rooms, messages },
      online: { users: onlineUsers, guests: onlineGuests, total: onlineUsers + onlineGuests },
      activity: { dau, wau, mau },
      registrations: { today: signupsToday, month: newUsers, guestsMonth: newGuests },
      series: { registrations: registrationsSeries, guests: guestSeries, messages: messagesSeries },
      genderBreakdown,
      topRoomsByMembers,
      topRoomsByMessages,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[admin/overview] error:', err.message);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
}
