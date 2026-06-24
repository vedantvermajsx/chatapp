import api from './api.js';
import { toast } from 'sonner';

class MessageService {
  constructor() {
    this.basePath = '/messages';
  }

  async sendRoomMessage({ roomId, text, media, uuid, skipToast = false }) {
    try {
      const response = await api.post(`${this.basePath}/send`, {
        roomId,
        message: text,
        media,
        uuid,
      });
      return response.data;
    } catch (error) {
      if (navigator.onLine) {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
      throw error;
    }
  }

  async sendPrivateMessage({ receiverId, content, receiverModel = 'User', media, uuid, skipToast = false }) {
    try {
      const response = await api.post(`${this.basePath}/private/send`, {
        receiverId,
        content,
        receiverModel,
        media,
        uuid,
      });
      return response.data;
    } catch (error) {
      if (navigator.onLine) {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
      throw error;
    }
  }

  async getPrivateMessages(otherUserId, limit = 20, before = null, after = null) {
    try {
      const params = new URLSearchParams({ limit });
      if (before) params.set('before', before);
      if (after)  params.set('after', after);
      const response = await api.get(`${this.basePath}/private/${otherUserId}?${params}`);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load messages');
      throw error;
    }
  }

  async getRoomMessages(roomId, limit = 20, before = null, after = null) {
    try {
      const params = new URLSearchParams({ limit });
      if (before) params.set('before', before);
      if (after)  params.set('after', after);
      const response = await api.get(`${this.basePath}/room/${roomId}?${params}`);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load messages');
      throw error;
    }
  }

  async getPrivateChats() {
    try {
      const response = await api.get(`${this.basePath}/private`);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load chats');
      throw error;
    }
  }

  async deletePrivateChat(otherUserId) {
    try {
      const response = await api.delete(`${this.basePath}/private/${otherUserId}`);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete chat');
      throw error;
    }
  }

  async uploadFile(file, folder = 'data', skipToast = false) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      const response = await api.post(`${this.basePath}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      if (navigator.onLine) {
        toast.error(error.response?.data?.message || 'Failed to upload file');
      }
      throw error;
    }
  }
}

const messageService = new MessageService();
export default messageService;