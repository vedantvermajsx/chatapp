import { getIO } from '../../socket.js';
import { publish } from '../messageBroker.js';

export function handleNewRoom(data) {
  const io = getIO();
  if (io) io.emit('newRoom', data);
  publish('newRoom', data);
}

export function handleRoomUpdated(data) {
  const io = getIO();
  if (io) io.emit('roomUpdated', data);
  publish('roomUpdated', data);
}

export function handleRoomDeleted(data) {
  const io = getIO();
  if (io) io.emit('roomDeleted', data);
  publish('roomDeleted', data);
}

export function handleUserJoinedRoom(data) {
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
}

export function handleRoomKeyNeeded(data) {
  const { to, payload } = data;
  const io = getIO();
  if (io) io.to(to).emit('roomKeyNeeded', payload);
}

export function handleUserLeftRoom(data) {
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
