import { handleRoomCreated } from './handleRoomCreated.js';
import { handleMemberJoined } from './handleMemberJoined.js';
import { handleMemberLeft } from './handleMemberLeft.js';
import { handleRoomDeleted } from './handleRoomDeleted.js';

export function registerRoomHandlers(subscribe, on) {
  subscribe('room.created');
  on('room.created', handleRoomCreated);

  subscribe('room.member.joined');
  on('room.member.joined', handleMemberJoined);

  subscribe('room.member.left');
  on('room.member.left', handleMemberLeft);

  subscribe('room.deleted');
  on('room.deleted', handleRoomDeleted);

 // console.log('[RoomProcessor] subscribed to room.created, room.member.joined, room.member.left, room.deleted');
}
