import emitNewRoom from '../emitters/newRoom.emitter.js';
import { publish } from './messageBroker.js';

export function enqueueMessage(messageData) {
  publish('message.created', messageData);
}

export function enqueueUserRegistration(userData) {
  publish('user.registered', userData);
}

export function enqueueGuestRegistration(guestData) {
  publish('guest.registered', guestData);
}

export function enqueueRoomCreation({ room, creatorId }) {
  publish('room.created', { room, creatorId });
  emitNewRoom(room);
}

export function enqueueRoomDeletion(roomId) {
  publish('room.deleted', { roomId });
}

export function enqueueRoomMemberJoined(roomId, userId) {
  publish('room.member.joined', { roomId, userId });
}

export function enqueueRoomMemberLeft(roomId, userId) {
  publish('room.member.left', { roomId, userId });
}
