export const loadRoomsHandler = async (searchQuery, setRooms, setLoadingRooms) => {
  setLoadingRooms(true);
  try {
    setRooms([]);
  } catch (error) {
    console.error('Failed to load rooms');
  } finally {
    setLoadingRooms(false);
  }
};
