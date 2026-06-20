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
        uuid
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
        uuid
      });
      return response.data;
    } catch (error) {
      if (navigator.onLine) {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
      throw error;
    }
  }

  async getPrivateMessages(otherUserId, limit = 20, before = null) {
    try {
      let url = `${this.basePath}/private/${otherUserId}?limit=${limit}`;
      if (before) {
        url += `&before=${encodeURIComponent(before)}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load messages');
      throw error;
    }
  }

  async getRoomMessages(roomId, limit = 20, before = null) {
    try {
      let url = `${this.basePath}/room/${roomId}?limit=${limit}`;
      if (before) {
        url += `&before=${encodeURIComponent(before)}`;
      }
      const response = await api.get(url);
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
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
