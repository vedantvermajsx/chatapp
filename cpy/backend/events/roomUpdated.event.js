export default function handleRoomUpdated(socket, io) {
  return (data) => {
    console.log('Room updated:', data);
  };
}
