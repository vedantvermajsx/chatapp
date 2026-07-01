import { getIO } from '../socket.js';
import { activeRooms } from '../socket.js';
import { publish } from './messageBroker.js';
import roomCacheClient from '../database/roomCacheClient.js';
import unreadCacheClient from '../database/unreadCacheClient.js';
import messageCountCacheClient from '../database/messageCountCacheClient.js';

const queue = [];
let workerRunning = false;

async function processItem(item) {
  const { type, data } = item;

  if (type === 'newMessage') {
    const { roomId, payload, senderSocketId } = data;
    const io = getIO();
    if (io) {
      if (senderSocketId) {
        io.to(roomId).except(senderSocketId).emit('newMessage', payload);
      } else {
        io.to(roomId).emit('newMessage', payload);
      }
    }
    publish('newMessage', { roomId, payload });
    _warmCacheForRoomMessage(roomId, payload.userId, payload.isSystemMessage).catch(
      (err) => console.error('[emitQueue] newMessage cache warm error:', err.message)
    );

  } else if (type === 'newPrivateMessage') {
    const { senderId, receiverId, payload } = data;
    const io = getIO();
    const senderStr = String(senderId);
    const receiverStr = String(receiverId);
    if (io) {
      io.to(receiverStr).emit('newPrivateMessage', payload);
      io.to(senderStr).emit('newPrivateMessage', payload);
      io.to(receiverStr).emit('unreadUpdate', { chatKey: `private_${senderStr}` });
    }
    publish('newPrivateMessage', { senderId: senderStr, receiverId: receiverStr, payload });
    if (!payload.isSystemMessage) {
      _warmCacheForPrivateMessage(senderId, receiverId).catch(
        (err) => console.error('[emitQueue] newPrivateMessage cache warm error:', err.message)
      );
    }

  } else if (type === 'newRoom') {
    const io = getIO();
    if (io) io.emit('newRoom', data);
    publish('newRoom', data);

  } else if (type === 'roomUpdated') {
    const io = getIO();
    if (io) io.emit('roomUpdated', data);
    publish('roomUpdated', data);

  } else if (type === 'roomDeleted') {
    const io = getIO();
    if (io) io.emit('roomDeleted', data);
    publish('roomDeleted', data);

  } else if (type === 'userJoinedRoom') {
    const { roomId, eventData, senderSocketId } = data;
    const io = getIO();
    if (io) {
      if (senderSocketId) {
        io.to(roomId).except(senderSocketId).emit('userJoinedRoom', eventData);
      } else {
        io.to(roomId).emit('userJoinedRoom', eventData);
      }
    }
    publish('userJoinedRoom', { roomId, data: eventData });

  } else if (type === 'userLeftRoom') {
    const { roomId, eventData, senderSocketId } = data;
    const io = getIO();
    if (io) {
      if (senderSocketId) {
        io.to(roomId).except(senderSocketId).emit('userLeftRoom', eventData);
      } else {
        io.to(roomId).emit('userLeftRoom', eventData);
      }
    }
    publish('userLeftRoom', { roomId, data: eventData });
  }
}

async function runWorker() {
  if (workerRunning) return;
  workerRunning = true;

  while (queue.length > 0) {
    const item = queue.shift();
    try {
      await processItem(item);
    } catch (err) {
      console.error('[emitQueue] worker error processing item:', item.type, err.message);
    }
  }

  workerRunning = false;
}

export function enqueueEmit(type, data) {
  queue.push({ type, data });
  setImmediate(runWorker);
}

async function _warmCacheForRoomMessage(roomId, senderId, isSystemMessage) {
  if (isSystemMessage) return;

  const memberIds = await roomCacheClient.getRoomMemberIds(roomId)
    ?? (await roomCacheClient.getRoomById(roomId))?.groupMembers
    ?? [];

  if (!memberIds.length) return;

  const activeViewerIds = [];
  for (const [userId, viewingRoomId] of activeRooms.entries()) {
    if (viewingRoomId === String(roomId)) activeViewerIds.push(userId);
  }

  const skip = new Set([String(senderId), ...activeViewerIds.map(String)]);
  const targets = memberIds.map(String).filter((id) => !skip.has(id));
  const chatKey = `room_${roomId}`;

  await Promise.all([
    targets.length > 0
      ? unreadCacheClient.incrementForRoom(memberIds, senderId, activeViewerIds, chatKey)
      : Promise.resolve(),
    messageCountCacheClient.incrementRoom(roomId),
    publish('notification.unread.room', { roomId, memberIds, senderId, activeViewerIds }),
  ]);
}

async function _warmCacheForPrivateMessage(senderId, receiverId) {
  await Promise.all([
    unreadCacheClient.incrementPrivate(receiverId, senderId),
    messageCountCacheClient.incrementPrivate(senderId, receiverId),
    publish('notification.unread.private', { receiverId, senderId }),
  ]);
}
