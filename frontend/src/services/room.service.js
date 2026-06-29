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

  async getAllRoomsPaginated(searchQuery = '', page = 0, limit = 20) {
    const response = await api.get(`${this.basePath}`, {
      params: { search: searchQuery, skip: page * limit, limit },
    });
   
    const data = response.data;
    if (Array.isArray(data)) {
      return { rooms: data, hasMore: data.length === limit };
    }
    return data;
  }

  async getJoinedRooms() {
    const response = await api.get(`${this.basePath}/joined`);
    return response?.data;
  }

  async getUnreadCounts() {
    try {
      const response = await api.get(`${this.basePath}/unread`);
      return response.data; // { 'room_{id}': number, 'private_{userId}': number }
    } catch {
      return {};
    }
  }

  async createRoom(groupName, groupDescription) {
    const response = await api.post(`${this.basePath}/create`, { groupName, groupDescription });
    return response.data;
  }

  async joinRoom(roomId, req) {
    const response = await api.post(`${this.basePath}/join`, { roomId,req });
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

  async searchRoomMembers(roomId, query, limit = 6, signal) {
    const response = await api.get(`${this.basePath}/${roomId}/members`, {
      params: { search: query, skip: 0, limit },
      signal,
    });
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw.members ?? []);
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
