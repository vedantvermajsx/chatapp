import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

class PublitioService {
  constructor() {
    this.apiKey = process.env.PUBLITIO_API_KEY;
    this.apiSecret = process.env.PUBLITIO_API_SECRET;
    this.apiUrl = 'https://api.publit.io/v1';
  }

  generateSignatureParams() {
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = Math.floor(Math.random() * 90000000) + 10000000; // 8-digit nonce
    const signature = crypto
      .createHash('sha1')
      .update(`${timestamp}${nonce}${this.apiSecret}`)
      .digest('hex');

    return {
      api_key: this.apiKey,
      api_timestamp: timestamp,
      api_nonce: nonce,
      api_signature: signature
    };
  }

  getUploadUrl(args = {}) {
    const params = this.generateSignatureParams();
    const queryParams = new URLSearchParams({ ...params, ...args });
    return `${this.apiUrl}/files/create?${queryParams.toString()}`;
  }
}

export const publitioService = new PublitioService();
