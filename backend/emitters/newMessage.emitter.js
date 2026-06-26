import { getIO } from '../socket.js';
import { publish } from '../utils/messageBroker.js';
import { activeRooms } from '../socket.js';
import roomCacheClient from '../database/roomCacheClient.js';
import unreadCacheClient from '../database/unreadCacheClient.js';

export default async function emitNewMessage(roomId, payload) {
  const io = getIO();
  if (io) {
    io.to(roomId).emit('newMessage', payload);
  }

  publish('newMessage', { roomId, payload });

  // ── Async unread increment for all members not currently viewing this room ──
  // Fire-and-forget — never block the HTTP response
  _incrementUnreadForRoom(roomId, payload.userId, payload.isSystemMessage).catch(
    err => console.error('[newMessage.emitter] unread increment error:', err.message)
  );
}

async function _incrementUnreadForRoom(roomId, senderId, isSystemMessage) {
  if (isSystemMessage) return; // system messages don't generate unread badges

  // Get all members of this room from cache (cheap — already in memory)
  const room = await roomCacheClient.getRoomById(roomId);
  if (!room?.groupMembers?.length) return;

  const memberIds = room.groupMembers;

  // Collect users actively viewing this room right now
  // activeRooms: userId (string) → roomId (string)
  const activeViewerIds = [];
  for (const [userId, viewingRoomId] of activeRooms.entries()) {
    if (viewingRoomId === String(roomId)) {
      activeViewerIds.push(userId);
    }
  }

  const chatKey = `room_${roomId}`;

  await unreadCacheClient.incrementForRoom(
    memberIds,
    senderId,
    activeViewerIds,
    chatKey
  );
}
