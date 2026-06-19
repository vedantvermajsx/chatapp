import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class MessageCacheClient {
  constructor() {
    this.baseUrl = process.env.CACHE_SERVICE_ROOT_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Message cache service:', this.baseUrl);
  }

  async getRoomMessages(roomId, { limit, before } = {}) {
    const params = {};
    if (limit) params.limit = limit;
    if (before) params.before = before;

    const response = await this.client.get(`/messages/room/${roomId}`, { params });
    return response.data;
  }

  async getPrivateMessages(userId, otherUserId, { limit, before } = {}) {
    const params = {};
    if (limit) params.limit = limit;
    if (before) params.before = before;

    const response = await this.client.get(
      `/messages/private/${userId}/${otherUserId}`,
      { params }
    );
    return response.data;
  }

  async getPrivateChats(userId) {
    const response = await this.client.get(`/messages/private-chats/${userId}`);
    return response.data.chats;
  }
}

export const messageCacheClient = new MessageCacheClient();
export default MessageCacheClient;
