import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class RoomCacheClient {
  constructor() {
    this.baseUrl = process.env.CACHE_SERVICE_ROOT_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Room cache client service:', this.baseUrl);
  }

  async addRoomToCache(id, data) {
    try {
      const resolvedData = await data;
      await this.client.post('/rooms', { id, data: resolvedData });
    } catch (err) {
      console.error(`[RoomCacheClient] Error in addRoomToCache for room ${id}:`, err.message);
    }
  }

  async isValidRoomId(id){
    try{
      const response = await this.client.get(`/rooms/${id}/exists`);
      return response.data;
    } catch (error) {
        console.error("Room validation failed", error);
        return false;
    }
  }

  async hasMember(roomId, userId) {
    try {
      const response = await this.client.get(`/rooms/${roomId}/hasMember/${userId}`);
      return response.data.hasMember;
    } catch (err) {
      console.error(`[RoomCacheClient] Error in hasMember for room ${roomId}:`, err.message);
      return false;
    }
  }

  async getRoomAdmin(roomId) {
    try {
      const response = await this.client.get(`/rooms/${roomId}/admin`);
      return response.data.adminId;
    } catch (err) {
      console.error(`[RoomCacheClient] Error in getRoomAdmin for room ${roomId}:`, err.message);
      return null;
    }
  }

  async refreshRoomCache(roomId) {
    try {
      await this.client.post(`/rooms/${roomId}/refresh`);
    } catch (err) {
      console.error(`[RoomCacheClient] Error in refreshRoomCache for room ${roomId}:`, err.message);
    }
  }

  async getRoomById(id) {
    try {
      const response = await this.client.get(`/rooms/${id}`);
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      console.error(`[RoomCacheClient] Error in getRoomById for room ${id}:`, err.message);
      return null;
    }
  }

  async getRoomByName(name) {
    try {
      const response = await this.client.get(`/rooms/name/${encodeURIComponent(name)}`);
      return response.data;
    } catch (err) {
      console.error(`[RoomCacheClient] Error in getRoomByName for name ${name}:`, err.message);
      return null;
    }
  }

  async getRoomsByUserId(userId) {
    try {
      const response = await this.client.get(`/rooms/user/${userId}`);
      return response.data;
    } catch (err) {
      console.error(`[RoomCacheClient] Error in getRoomsByUserId for user ${userId}:`, err.message);
      return [];
    }
  }

  async getRoomMembers(roomId, { skip = 0, limit = 20, search = '' } = {}) {
    try {
      const params = { skip, limit, search };
      const response = await this.client.get(`/rooms/${roomId}/members`, { params });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      console.error(`[RoomCacheClient] Error in getRoomMembers for room ${roomId}:`, err.message);
      return null;
    }
  }

  async invalidateRoomMembers(roomId, { maxMembers = 500, pageSize = 20 } = {}) {
    try {
      await this.client.post(`/rooms/${roomId}/invalidate-members`, { maxMembers, pageSize });
    } catch (err) {
      console.error(`[RoomCacheClient] Error in invalidateRoomMembers for room ${roomId}:`, err.message);
    }
  }

  async getAllRooms(search = '') {
    try {
      const response = await this.client.get('/rooms', { params: { search } });
      return response.data;
    } catch (err) {
      console.error('[RoomCacheClient] Error in getAllRooms:', err.message);
      return [];
    }
  }

  async deleteRoomById(id) {
    try {
      await this.client.delete(`/rooms/${id}`);
    } catch (err) {
      console.error(`[RoomCacheClient] Error in deleteRoomById for room ${id}:`, err.message);
    }
  }
}

export default new RoomCacheClient();