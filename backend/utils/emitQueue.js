import { getIO } from '../socket.js';
import { activeRooms } from '../socket.js';
import { publish } from './messageBroker.js';
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
    try {
      _warmCacheForRoomMessage(roomId, payload.userId, payload.isSystemMessage);
    } catch (err) {
      console.error('[emitQueue] newMessage cache warm error:', err.message);
    }

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
      try {
        _warmCacheForPrivateMessage(senderId, receiverId);
      } catch (err) {
        console.error('[emitQueue] newPrivateMessage cache warm error:', err.message);
      }
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

  const idList = [...caughtUpIds];
  if (idList.length > 0) {
    unreadCacheClient.resetMultiple(idList, chatKey).catch(err =>
      console.error('[emitQueue] unreadCache resetMultiple error:', err.message)
    );
  }
}

function _warmCacheForPrivateMessage(senderId, receiverId) {
  unreadCacheClient.incrementPrivate(receiverId, senderId).catch(err =>
    console.error('[emitQueue] incrementPrivate unread error:', err.message)
  );
  
  messageCountCacheClient.incrementPrivate(senderId, receiverId).catch(err =>
    console.error('[emitQueue] incrementPrivate count error:', err.message)
  );
  
  publish('notification.unread.private', { receiverId, senderId });
}
