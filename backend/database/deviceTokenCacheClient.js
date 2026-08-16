import axios from 'axios';
import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { attachHmacInterceptor } from '../utils/hmacClient.js';

dotenv.config();

class DeviceTokenCacheClient {
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

  async addToken(userId, token, platform, ttlMs) {
    const res = await this.client.post(`/device-tokens/${userId}`, { token, platform, ttlMs });
    return res.data;
  }

  async getTokens(userId) {
    const res = await this.client.get(`/device-tokens/${userId}`);
    return res.data?.tokens || [];
  }

  async removeToken(userId, token) {
    const res = await this.client.delete(`/device-tokens/${userId}`, { data: { token } });
    return res.data;
  }

  async removeAllForUser(userId) {
    const res = await this.client.delete(`/device-tokens/${userId}/all`);
    return res.data;
  }
}

export default new DeviceTokenCacheClient();
