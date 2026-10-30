import api from './api.js';
import { toast } from 'sonner';
import axios from 'axios';
import { _addQualities, getMediaMeta, getMaxFileSize } from '../utils/media.utils.js';

import userService from './user.service.js';
import keyManager from './keyManager.js';
import {
  encryptForRoom, decryptForRoom,
  encryptPrivateMessage, decryptPrivateMessage,
} from '../utils/crypto.js';

class MessageService {
  constructor() {
    this.basePath = '/messages';
    this._publicKeyCache = new Map();
  }

  async _getPublicKey(userId) {
    if (this._publicKeyCache.has(userId)) return this._publicKeyCache.get(userId);
    try {
      const profile = await userService.getUserProfile(userId);
      const publicKey = profile?.publicKey || null;
      if (publicKey) this._publicKeyCache.set(userId, publicKey);
      return publicKey;
    } catch (err) {
      console.error('[messageService] failed to fetch public key:', err.message);
      return null;
    }
  }

  async _getSelfPublicKey() {
    const selfUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (selfUser?.publicKey) return selfUser.publicKey;

    try {
      const res = await userService.getProfile();
      const profile = res?.user || res;
      if (profile?.publicKey) {
        const updated = { ...(selfUser || {}), publicKey: profile.publicKey };
        localStorage.setItem('user', JSON.stringify(updated));
        return profile.publicKey;
      }
    } catch (err) {
      console.error('[messageService] failed to fetch self public key:', err.message);
    }
    return null;
  }

  async _decryptReplyPreviewForRoom(replyTo, roomPrivateKeyPem) {
    if (!replyTo?.iv || !replyTo?.wrappedKey || !roomPrivateKeyPem) return replyTo;
    const { iv, wrappedKey, ...clean } = replyTo;
    try {
      const text = await decryptForRoom(replyTo.text, iv, wrappedKey, roomPrivateKeyPem);
      return { ...clean, text };
    } catch (err) {
      console.error('[messageService] room replyTo decrypt failed:', err.message);
      return { ...clean, text: 'Unable to decrypt message' };
    }
  }

  async _decryptRoomMessages(messages, roomPrivateKeyPem) {
    if (!messages?.length) return messages;
    if (!roomPrivateKeyPem) return messages;

    return Promise.all(messages.map(async (msg) => {
      const replyTo = msg.replyTo ? await this._decryptReplyPreviewForRoom(msg.replyTo, roomPrivateKeyPem) : msg.replyTo;
      if (!msg.iv || !msg.wrappedKey) return { ...msg, replyTo };
      const { iv, wrappedKey, ...clean } = msg;
      try {
        const text = await decryptForRoom(msg.text, iv, wrappedKey, roomPrivateKeyPem);
        return { ...clean, text, replyTo };
      } catch (err) {
        console.error('[messageService] room decrypt failed:', err.message);
        return { ...clean, text: 'Unable to decrypt message', replyTo };
      }
    }));
  }

  async _decryptReplyPreviewForPrivate(replyTo, selfId, privateKeyPem) {
    if (!replyTo?.iv) return replyTo;
    const { iv, senderKeyWrapped, receiverKeyWrapped, ...clean } = replyTo;
    const isOwn = String(replyTo.senderId) === String(selfId);
    const wrappedKeyForMe = isOwn ? senderKeyWrapped : receiverKeyWrapped;
    if (!wrappedKeyForMe) return { ...clean, text: '🔒 Unable to decrypt message' };
    try {
      const text = await decryptPrivateMessage(replyTo.text, iv, wrappedKeyForMe, privateKeyPem);
      return { ...clean, text };
    } catch (err) {
      console.error('[messageService] private replyTo decrypt failed:', err.message);
      return { ...clean, text: '🔒 Unable to decrypt message' };
    }
  }

  async _decryptPrivateMessages(messages, otherUserId) {
    if (!messages?.length) return messages;
    const selfId = keyManager.getSelfId();
    const privateKeyPem = await keyManager.getSelfPrivateKey();
    if (!privateKeyPem) return messages;

    return Promise.all(messages.map(async (msg) => {
      const replyTo = msg.replyTo ? await this._decryptReplyPreviewForPrivate(msg.replyTo, selfId, privateKeyPem) : msg.replyTo;
      if (!msg.iv) return { ...msg, replyTo };
      const { iv, senderKeyWrapped, receiverKeyWrapped, ...clean } = msg;
      const isOwn = String(msg.senderId) === String(selfId);
      const wrappedKeyForMe = isOwn ? senderKeyWrapped : receiverKeyWrapped;
      if (!wrappedKeyForMe) return { ...clean, text: '🔒 Unable to decrypt message', replyTo };
      try {
        const text = await decryptPrivateMessage(msg.text, iv, wrappedKeyForMe, privateKeyPem);
        return { ...clean, text, replyTo };
      } catch (err) {
        console.error('[messageService] private decrypt failed:', err.message);
        return { ...clean, text: '🔒 Unable to decrypt message' };
      }
    }));
  }

  async sendRoomMessage({ roomId, text, media, uuid, roomPublicKey, replyTo, taggedUser }) {
    const strippedMedia = media ? { url: media.url, type: media.type } : null;
    const body = { roomId, media: strippedMedia, uuid, replyTo: replyTo || null, taggedUser: taggedUser || null };

    if (text && roomPublicKey) {
      const { content, iv, wrappedKey } = await encryptForRoom(text, roomPublicKey);
      body.message = content;
      body.iv = iv;
      body.wrappedKey = wrappedKey;
    } else {
      body.message = text;
    }

    const response = await api.post(`${this.basePath}/send`, body);
    return response.data;
  }

  async sendPrivateMessage({ receiverId, content, receiverModel = 'User', media, uuid, isSystemMessage, systemType, replyTo, taggedUser }) {
    const strippedMedia = media ? { url: media.url, type: media.type } : null;
    const body = {
      receiverId,
      receiverModel,
      media: strippedMedia,
      uuid,
      replyTo: replyTo || null,
      taggedUser: taggedUser || null,
      ...(isSystemMessage && { isSystemMessage: true, systemType }),
    };

    if (content) {
      const selfPublicKey = await this._getSelfPublicKey();
      const receiverPublicKey = await this._getPublicKey(receiverId);

      if (selfPublicKey && receiverPublicKey) {
        const { content: enc, iv, senderKeyWrapped, receiverKeyWrapped } =
          await encryptPrivateMessage(content, selfPublicKey, receiverPublicKey);
        body.content = enc;
        body.iv = iv;
        body.senderKeyWrapped = senderKeyWrapped;
        body.receiverKeyWrapped = receiverKeyWrapped;
      } else {
        console.warn('[messageService] Missing public key for encryption.', { selfPublicKey: !!selfPublicKey, receiverPublicKey: !!receiverPublicKey });
        body.content = content;
      }
    } else {
      body.content = content;
    }

    const response = await api.post(`${this.basePath}/private/send`, body);
    return response.data;
  }

  async getPrivateMessages(otherUserId, limit = 20, before = null, after = null) {
    try {
      const params = new URLSearchParams({ limit });
      if (before) params.set('before', before);
      if (after)  params.set('after', after);
      const response = await api.get(`${this.basePath}/private/${otherUserId}?${params}`);
      const data = response.data;
      data.messages = await this._decryptPrivateMessages(data.messages, otherUserId);
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load messages');
      throw error;
    }
  }

  async getLastReadStatus(otherUserId) {
    try {
      const response = await api.get(`${this.basePath}/private/${otherUserId}/last-seen`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getRoomMessages(roomId, limit = 20, before = null, after = null, roomPrivateKey = null) {
    try {
      const params = new URLSearchParams({ limit });
      if (before) params.set('before', before);
      if (after)  params.set('after', after);
      const response = await api.get(`${this.basePath}/room/${roomId}?${params}`);
      const data = response.data;
      data.messages = await this._decryptRoomMessages(data.messages, roomPrivateKey);
      return data;
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

  async uploadFile(file, folder = 'data', skipToast = false, onProgress = null, signal = null) {
    const maxSize = getMaxFileSize(file.type);
    if (file.size > maxSize) {
      const msg = `File size exceeds the ${maxSize / 1024 / 1024}MB limit`;
      if (!skipToast) toast.error(msg);
      throw new Error(msg);
    }

    try {
      const sigResponse = await api.get(`${this.basePath}/upload-signature`, {
        params: { folder, type: file.type, size: file.size }
      });
      const { signature, timestamp, api_key, cloud_name, folder: targetFolder } = sigResponse.data;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', api_key);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', targetFolder);

      const { mediaType, resourceType } = getMediaMeta(file.type);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloud_name}/${resourceType}/upload`;
      const uploadResponse = await axios.post(cloudinaryUrl, formData, {
        signal,
        onUploadProgress: ({ loaded, total }) => {
          if (!total) return;
          // hold at 99 until Cloudinary has actually responded
          onProgress?.(Math.min(99, Math.floor((loaded * 100) / total)));
        }
      });
      onProgress?.(100);

      const result = {
        url: uploadResponse.data.secure_url,
        type: mediaType
      };

      return _addQualities(result);
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      if (navigator.onLine && !skipToast) {
        toast.error(error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Failed to upload file');
      }
      throw error;
    }
  }
}

const messageService = new MessageService();
export default messageService;