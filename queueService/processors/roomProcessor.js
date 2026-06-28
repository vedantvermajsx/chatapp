import { handleRoomCreated } from '../controller/room/handleRoomCreated.controller.js';
import { handleMemberJoined } from '../controller/room/handleMemberJoined.controller.js';
import { handleMemberLeft } from '../controller/room/handleMemberLeft.controller.js';

export function registerRoomHandlers(subscribe, on) {
  subscribe('room.created');
  on('room.created', handleRoomCreated);

  subscribe('room.member.joined');
  on('room.member.joined', handleMemberJoined);

  subscribe('room.member.left');
  on('room.member.left', handleMemberLeft);

  console.log('[RoomProcessor] subscribed to room.created, room.member.joined, room.member.left');
}
