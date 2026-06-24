import { userRooms } from '../socket.js';

export default function handleUserLeftRoom(socket, io) {
  return (data) => {
    console.log('User left room:', data);
  };
}
