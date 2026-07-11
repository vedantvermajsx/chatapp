import api from './api.js';
import { toast } from 'sonner';
import axios from 'axios';
import { _addQualities, getMediaMeta } from '../utils/media.utils.js';

class MessageService {
  constructor() {
    this.basePath = '/messages';
  }

  async sendRoomMessage({ roomId, text, media, uuid, skipToast = false }) {
    try {
      const strippedMedia = media ? { url: media.url, type: media.type, thumbnail: media.thumbnail || null } : null;
      const response = await api.post(`${this.basePath}/send`, {
        roomId,
        message: text,
        media: strippedMedia,
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


  async sendPrivateMessage({ receiverId, content, receiverModel = 'User', media, uuid, isSystemMessage, systemType, skipToast = false }) {
    try {
      const strippedMedia = media ? { url: media.url, type: media.type } : null;
      const response = await api.post(`${this.basePath}/private/send`, {
        receiverId,
        content,
        receiverModel,
        media: strippedMedia,
        uuid,
        ...(isSystemMessage && { isSystemMessage: true, systemType }),
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

  async uploadFile(file, folder = 'data', skipToast = false, onProgress = null) {
    const MAX_FILE_SIZE = 8 * 1024 * 1024; 
    if (file.size > MAX_FILE_SIZE) {
      if (!skipToast) toast.error('File size exceeds the 8MB limit');
      throw new Error('File size exceeds 8MB limit');
    }

    try {
      const { mediaType } = getMediaMeta(file.type);
      const isVideo = mediaType === 'video';
      const provider = isVideo ? 'publitio' : 'cloudinary';

      const sigResponse = await api.get(`${this.basePath}/upload-signature?folder=${folder}&provider=${provider}`);
      
      let result;
      if (sigResponse.data.provider === 'publitio') {
        // Publit.io upload
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await axios.post(sigResponse.data.uploadUrl, formData, {
          onUploadProgress: ({ loaded, total }) => {
            if (!total) return;
            const percentage = Math.min(100, Math.round((loaded * 100) / total));
            onProgress?.(percentage);
          }
        });

        if (!uploadResponse.data.success) {
          throw new Error(uploadResponse.data.error?.message || 'Publit.io upload failed');
        }

        const originalUrl = uploadResponse.data.url_preview;
        const url = originalUrl.replace(/https:\/\/[^.]+\.publit\.io\//, 'https://gatherup.publit.io/');
        
        result = {
          url: url,
          thumbnail: uploadResponse.data.url_thumbnail.replace(/https:\/\/[^.]+\.publit\.io\//, 'https://gatherup.publit.io/'),
          type: mediaType
        };
      } else {
const { signature, timestamp, api_key, cloud_name, folder: targetFolder } = sigResponse.data;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', targetFolder);

        const { resourceType } = getMediaMeta(file.type);
        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;
        const uploadResponse = await axios.post(cloudinaryUrl, formData, {
          onUploadProgress: ({ loaded, total }) => {
            if (!total) return;
            const percentage = Math.min(100, Math.round((loaded * 100) / total));
            onProgress?.(percentage);
          }
        });

        result = {
          url: uploadResponse.data.secure_url,
          type: mediaType
        };
      }

      return _addQualities(result);
    } catch (error) {
      if (navigator.onLine && !skipToast) {
        toast.error(error.response?.data?.message || error.message || 'Failed to upload file');
      }
      throw error;
    }
  }
}

const messageService = new MessageService();
export default messageService;