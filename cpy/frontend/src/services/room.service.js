import api from './api.js';

class RoomService {
  constructor() {
    this.basePath = '/rooms';
  }

  async getAllRooms(searchQuery = '') {
    const response = await api.get(`${this.basePath}`, {
      params: { search: searchQuery },
    });
    return response.data;
  }

  async createRoom(groupName, groupDescription) {
    const response = await api.post(`${this.basePath}/create`, { groupName, groupDescription });
    return response.data;
  }

  async joinRoom(roomId) {
    const response = await api.post(`${this.basePath}/join`, { roomId });
    return response.data;
  }

  async leaveRoom(roomId) {
    const response = await api.post(`${this.basePath}/leave`, { roomId });
    return response.data;
  }

  async getRoomMembers(roomId, skip = 0, search = '') {
    const response = await api.get(`${this.basePath}/${roomId}/members`, {
      params: { skip, limit: 20, search }
    });
    return response.data;
  }

  async deleteRoom(roomId) {
    const response = await api.delete(`${this.basePath}/${roomId}`);
    return response.data;
  }

  async updateRoom(roomId, roomData) {
    const response = await api.put(`${this.basePath}/${roomId}`, roomData);
    return response.data;
  }
}

const roomService = new RoomService();
export default roomService;
