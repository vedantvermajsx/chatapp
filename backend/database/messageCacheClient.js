import axios from 'axios';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';

dotenv.config();

class MessageCacheClient {
  constructor() {
    this.baseUrl = process.env.CACHE_SERVICE_ROOT_URL;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: { 'Content-Type': 'application/json' },
    });
    attachHmacInterceptor(this.client);
    console.log('Message cache service:', this.baseUrl);
  }

  async getRoomMessages(roomId, { userId, limit, before, after } = {}) {
    const response = await this.client.get(`/messages/room/${roomId}`, {
      params: { userId, limit, before, after },
    });
    return response.data;
  }

  async getPrivateMessages(userId, otherUserId, { limit, before, after } = {}) {
    const response = await this.client.get(`/messages/private/${userId}/${otherUserId}`, {
      params: { limit, before, after },
    });
    return response.data;
  }

  async getPrivateMessage(senderId, receiverId, messageId) {
    const response = await this.client.get(`/messages/private/${senderId}/${receiverId}/${messageId}`);
    return response.data;
  }

  async getPrivateChats(userId) {
    const response = await this.client.get(`/messages/private-chats/${userId}`);
    return response.data.chats;
  }

  async invalidatePrivateMessages(userId, otherUserId) {
    try {
      await this.client.post('/messages/invalidate', { senderId: userId, receiverId: otherUserId });
    } catch (err) {
      console.error('[MessageCacheClient] Error invalidating private messages:', err.message);
    }
  }

  async invalidateRoomMessages(roomId) {
    try {
      await this.client.post('/messages/invalidate', { roomId });
    } catch (err) {
      console.error('[MessageCacheClient] Error invalidating room messages:', err.message);
    }
  }

  async appendRoomMessage(roomId, messageData) {
    try {
      await this.client.post('/messages/append', { roomId, messages: [messageData] });
    } catch (err) {
      console.error('[MessageCacheClient] Error appending room message:', err.message);
    }
  }

  async appendPrivateMessage(senderId, receiverId, messageData) {
    try {
      await this.client.post('/messages/append', { senderId, receiverId, messages: [messageData] });
    } catch (err) {
      console.error('[MessageCacheClient] Error appending private message:', err.message);
    }
  }
}

export const messageCacheClient = new MessageCacheClient();