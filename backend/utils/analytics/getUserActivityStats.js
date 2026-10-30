import Message from '../../models/message.model.js';
import Room from '../../models/room.model.js';
import { DAY_MS } from './constants.js';

export async function getUserActivityStats(userId, createdAt) {
  const [messagesSent, roomsJoined, lastMessage] = await Promise.all([
    Message.countDocuments({ senderId: userId }),
    Room.countDocuments({ groupMembers: userId, isDeleted: false }),
    Message.findOne({ senderId: userId }, 'timestamp').sort({ timestamp: -1 }).lean(),
  ]);

  return {
    messagesSent,
    roomsJoined,
    lastMessageAt: lastMessage?.timestamp || null,
    accountAgeDays: Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / DAY_MS)),
  };
}
