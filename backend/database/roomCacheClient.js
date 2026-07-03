import axios from 'axios';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';

dotenv.config();

class RoomCacheClient {
  constructor() {
    this.baseUrl = process.env.CACHE_SERVICE_ROOT_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' }
    });
    attachHmacInterceptor(this.client);

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

  async getAllRooms(search = '', { skip = 0, limit = 20 } = {}) {
    try {
      const response = await this.client.get('/rooms', { params: { search, skip, limit } });

      const data = response.data;
      if (data && typeof data === 'object' && Array.isArray(data.rooms)) {
        return data;
      }

      return { rooms: Array.isArray(data) ? data : [], total: 0, hasMore: false };
    } catch (err) {
      console.error('[RoomCacheClient] Error in getAllRooms:', err.message);
      return { rooms: [], total: 0, hasMore: false };
    }
  }

  async markRoomDeleted(id) {
    try {
      await this.client.post(`/rooms/${id}/mark-deleted`);
    } catch (err) {
      console.error(`[RoomCacheClient] Error in markRoomDeleted for room ${id}:`, err.message);
    }
  }

  async deleteRoomById(id) {
    try {
      await this.client.delete(`/rooms/${id}`);
    } catch (err) {
      console.error(`[RoomCacheClient] Error in deleteRoomById for room ${id}:`, err.message);
    }
  }

  async getRoomMemberIds(roomId) {
    try {
      const response = await this.client.get(`/rooms/${roomId}/memberIds`);
      return response.data.memberIds;
    } catch (err) {
      if (err.response?.status === 404) return null;
      console.error(`[RoomCacheClient] Error in getRoomMemberIds for room ${roomId}:`, err.message);
      return null;
    }
  }

  async addRoomMember(roomId, userId) {
    try {
      const response = await this.client.post(`/rooms/${roomId}/members/add`, { userId });
      return response.data?.room ?? null;
    } catch (err) {
      console.error(`[RoomCacheClient] Error in addRoomMember for room ${roomId}:`, err.message);
      return null;
    }
  }

  async removeRoomMember(roomId, userId) {
    try {
      await this.client.post(`/rooms/${roomId}/members/remove`, { userId });
    } catch (err) {
      console.error(`[RoomCacheClient] Error in removeRoomMember for room ${roomId}:`, err.message);
    }
  }

  async getJoinedRooms(userId) {
    try {
      const response = await this.client.get(`/rooms/user/${userId}/joined`);
      return response.data;
    } catch (err) {
      console.error(`[RoomCacheClient] Error in getJoinedRooms for user ${userId}:`, err.message);
      return null;
    }
  }
}

export default new RoomCacheClient();