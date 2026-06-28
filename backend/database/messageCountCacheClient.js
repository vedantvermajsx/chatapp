import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

class MessageCountCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 2000,
    });
  }

  async getRoomCount(roomId) {
    try {
      const res = await this.client.get(`/message-count/room/${roomId}`);
      return res.data.count;
    } catch (err) {
      console.error('[MessageCountCacheClient] getRoomCount error:', err.message);
      return null;
    }
  }

  async getPrivateCount(senderId, receiverId) {
    try {
      const res = await this.client.get(`/message-count/private/${senderId}/${receiverId}`);
      return res.data.count;
    } catch (err) {
      console.error('[MessageCountCacheClient] getPrivateCount error:', err.message);
      return null;
    }
  }

  async incrementRoom(roomId) {
    try {
      await this.client.post(`/message-count/room/${roomId}/increment`);
    } catch (err) {
      console.error('[MessageCountCacheClient] incrementRoom error:', err.message);
    }
  }

  async incrementPrivate(senderId, receiverId) {
    try {
      await this.client.post('/message-count/private/increment', { senderId, receiverId });
    } catch (err) {
      console.error('[MessageCountCacheClient] incrementPrivate error:', err.message);
    }
  }

  async invalidateRoom(roomId) {
    try {
      await this.client.delete(`/message-count/room/${roomId}`);
    } catch (err) {
      console.error('[MessageCountCacheClient] invalidateRoom error:', err.message);
    }
  }

  async invalidatePrivate(senderId, receiverId) {
    try {
      await this.client.delete(`/message-count/private/${senderId}/${receiverId}`);
    } catch (err) {
      console.error('[MessageCountCacheClient] invalidatePrivate error:', err.message);
    }
  }
}

export default new MessageCountCacheClient();
