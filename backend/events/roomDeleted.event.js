export default function handleRoomDeleted(socket, io) {
  return (data) => {
    console.log('Room deleted:', data);
  };
}
