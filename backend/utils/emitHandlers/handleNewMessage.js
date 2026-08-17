import { getIO, activeRooms, onlineUsers } from '../../socket.js';
import { publish } from '../messageBroker.js';
import unreadCacheClient from '../../database/unreadCacheClient.js';
import messageCountCacheClient from '../../database/messageCountCacheClient.js';
import roomCacheClient from '../../database/roomCacheClient.js';
import { sendPushToUsers } from '../pushNotifications.js';

export async function handleNewMessage(data) {
  const { roomId, payload, senderSocketId } = data;
  const io = getIO();
  if (io) {
    const activeViewerSocketIds = [];
    for (const [userId, viewingRoomId] of activeRooms.entries()) {
      if (viewingRoomId === String(roomId)) {
        const entry = onlineUsers.get(String(userId));
        if (entry?.socketId) activeViewerSocketIds.push(entry.socketId);
      }
    }

    let msgEmit = io.to(roomId);
    if (senderSocketId) {
      msgEmit = msgEmit.except(senderSocketId);
    }
    
    let unreadEmit = io.to(roomId);
    const unreadExceptIds = [...new Set([senderSocketId, ...activeViewerSocketIds].filter(Boolean))];
    for (const id of unreadExceptIds) {
      unreadEmit = unreadEmit.except(id);
    }
    console.log(unreadExceptIds);
    msgEmit.emit('newMessage', payload);
    unreadEmit.emit('unreadUpdate', { chatKey: `room_${roomId}` });
  }
  publish('newMessage', { roomId, payload });
  try {
    _warmCacheForRoomMessage(roomId, payload.userId, payload.isSystemMessage);
  } catch (err) {
    console.error('[emitQueue] newMessage cache warm error:', err.message);
  }
  if (!payload.isSystemMessage) {
    _pushForRoomMessage(roomId, payload).catch((err) =>
      console.error('[emitQueue] push newMessage error:', err.message)
    );
  }
}

function _warmCacheForRoomMessage(roomId, senderId, isSystemMessage) {
  if (isSystemMessage) return;

  const chatKey = `room_${roomId}`;

  messageCountCacheClient.incrementRoom(roomId).catch(err => 
    console.error('[emitQueue] incrementRoom error:', err.message)
  );

  const activeViewerIds = [];
  for (const [userId, viewingRoomId] of activeRooms.entries()) {
    if (viewingRoomId === String(roomId)) activeViewerIds.push(userId);
  }
  const caughtUpIds = new Set([String(senderId), ...activeViewerIds.map(String)]);

  for (const id of caughtUpIds) {
    unreadCacheClient.decrement(id, chatKey, 1).catch(err =>
      console.error('[emitQueue] unreadCache decrement error:', err.message)
    );
  }
}

async function _pushForRoomMessage(roomId, payload) {
  const senderId = String(payload.userId);

  const activeViewerIds = new Set([senderId]);
  for (const [userId, viewingRoomId] of activeRooms.entries()) {
    if (viewingRoomId === String(roomId)) activeViewerIds.add(String(userId));
  }

  const memberIds = await roomCacheClient.getRoomMemberIds(roomId);
  if (!memberIds?.length) return;

  const recipientIds = memberIds
    .map(String)
    .filter((id) => !activeViewerIds.has(id));
  if (!recipientIds.length) return;

  let roomName = 'New message';
  try {
    const room = await roomCacheClient.getRoomById(roomId);
    roomName = room?.groupName || room?.name || roomName;
  } catch {
    // fall back to default title
  }

  await sendPushToUsers(recipientIds, {
    title: roomName,
    body: `${payload.username || 'Someone'} sent a new message`,
    data: {
      type: 'room',
      roomId: String(roomId),
      messageId: payload._id || '',
    },
  });
}
