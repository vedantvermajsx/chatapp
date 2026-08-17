import { getIO, activeRooms, onlineUsers } from '../socket.js';
import { publish } from './messageBroker.js';
import unreadCacheClient from '../database/unreadCacheClient.js';
import messageCountCacheClient from '../database/messageCountCacheClient.js';
import roomCacheClient from '../database/roomCacheClient.js';
import { sendPushToUser, sendPushToUsers } from './pushNotifications.js';

function pushPreviewText(payload = {}) {
  if (payload.media) return '📎 Sent an attachment';
  return payload.content || payload.text || 'Sent a message';
}

const queue = [];
let workerRunning = false;

async function processItem(item) {
  const { type, data } = item;

  if (type === 'newMessage') {
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

      sendPushToUser(receiverStr, {
        title: payload.senderUsername || payload.username || 'New message',
        body: pushPreviewText(payload),
        data: {
          type: 'private',
          senderId: senderStr,
          receiverId: receiverStr,
          messageId: payload._id || '',
        },
      }).catch((err) => console.error('[emitQueue] push newPrivateMessage error:', err.message));
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

  } else if (type === 'roomKeyNeeded') {
    const { to, payload } = data;
    const io = getIO();
    if (io) io.to(to).emit('roomKeyNeeded', payload);

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
    body: `${payload.username || 'Someone'}: ${pushPreviewText(payload)}`,
    data: {
      type: 'room',
      roomId: String(roomId),
      messageId: payload._id || '',
    },
  });
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
