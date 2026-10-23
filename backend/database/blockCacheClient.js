import axios from 'axios';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';

dotenv.config();

class BlockCacheClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.CACHE_SERVICE_ROOT_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
    attachHmacInterceptor(this.client);
  }

  async getUserIps(userId) {
    try {
      const res = await this.client.get(`/blocks/ips/${userId}`);
      return res.data?.ips || [];
    } catch (err) {
      console.error('[BlockCacheClient] getUserIps error:', err.message);
      return [];
    }
  }

  async isBlockedPrivate(senderId, receiverId, senderIp = null) {
    try {
      const res = await this.client.post('/blocks/check/private', { senderId, receiverId, senderIp });
      return !!res.data?.blocked;
    } catch (err) {
      console.error('[BlockCacheClient] isBlockedPrivate error:', err.message);
      return false;
    }
  }

  async isBlockedInRoom(roomId, senderId, senderIp = null) {
    try {
      const res = await this.client.post('/blocks/check/room', { roomId, senderId, senderIp });
      return !!res.data?.blocked;
    } catch (err) {
      console.error('[BlockCacheClient] isBlockedInRoom error:', err.message);
      return false;
    }
  }

  async listUserBlocks(blockerId) {
    const res = await this.client.get(`/blocks/user/${blockerId}`);
    return res.data?.blocked || [];
  }

  async addUserBlock(blockerId, blockedId, username, ips) {
    await this.client.put(`/blocks/user/${blockerId}/${blockedId}`, { username, ips });
  }

  async removeUserBlock(blockerId, blockedId) {
    await this.client.delete(`/blocks/user/${blockerId}/${blockedId}`);
  }

  async listRoomBlocks(roomId) {
    const res = await this.client.get(`/blocks/room/${roomId}`);
    return res.data?.blocked || [];
  }

  async addRoomBlock(roomId, userId, username, ips) {
    await this.client.put(`/blocks/room/${roomId}/${userId}`, { username, ips });
  }

  async removeRoomBlock(roomId, userId) {
    await this.client.delete(`/blocks/room/${roomId}/${userId}`);
  }
}

export default new BlockCacheClient();
