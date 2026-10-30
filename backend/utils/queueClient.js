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

export function enqueueUserIp(data) {
  publish('user.ip.recorded', data);
}

export function enqueueUserBlocked(data) {
  publish('user.blocked', data);
}

export function enqueueUserUnblocked(data) {
  publish('user.unblocked', data);
}

export function enqueueRoomUserBlocked(data) {
  publish('room.user.blocked', data);
}

export function enqueueRoomUserUnblocked(data) {
  publish('room.user.unblocked', data);
}

export function enqueueUserBanned(data) {
  publish('user.banned', data);
}

export function enqueueUserUnbanned(data) {
  publish('user.unbanned', data);
}
