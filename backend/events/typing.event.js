import {
  handlePrivateTypingEvent,
  stopPrivateTyping,
  cleanupPrivateTypingOnDisconnect
} from './typing/privateTyping.js';
import {
  handleRoomTypingEvent,
  stopRoomTyping,
  cleanupRoomTypingOnDisconnect
} from './typing/roomTyping.js';

export function handleTyping(socket, io) {
  return ({ type, receiverId, roomId, charCount }) => {
    const userId   = String(socket.user._id || socket.user.id);
    const username = socket.user.username;

    if (type === 'private') {
      handlePrivateTypingEvent(io, userId, username, receiverId, charCount);
    } else if (type === 'room') {
      handleRoomTypingEvent(socket, io, userId, roomId);
    }
  };
}

export function handleStopTyping(socket, io) {
  return ({ type, receiverId, roomId }) => {
    const userId = String(socket.user._id || socket.user.id);

    if (type === 'private') {
      if (!receiverId) return;
      stopPrivateTyping(io, userId, String(receiverId));
    } else if (type === 'room') {
      if (!roomId) return;
      stopRoomTyping(io, userId, String(roomId), socket);
    }
  };
}

export function cleanupTypingOnDisconnect(io, socket) {
  const userId = String(socket.user?._id || socket.user?.id);
  if (!userId) return;

  cleanupPrivateTypingOnDisconnect(io, userId);
  cleanupRoomTypingOnDisconnect(socket, userId);
}