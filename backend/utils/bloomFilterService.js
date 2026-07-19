import axios from "axios";
import http from 'http';
import https from 'https';
import dotenv from "dotenv";
import { attachHmacInterceptor } from "./hmacClient.js";
dotenv.config();

class BloomFilterService {
  constructor() {
    this.baseUrl = process.env.BLOOM_FILTER_SERVICE_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 5000,
      httpAgent: new http.Agent({ keepAlive: true, maxSockets: 100 }),
      httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 100 }),
    });
    attachHmacInterceptor(this.client);

    console.log("Bloom Filter Service:", this.baseUrl);
  }

  async add(value) {
    await this.client.post("/add", { value }, { timeout: 30000 });
  }

  async remove(value) {
    await this.client.post("/remove", { value }, { timeout: 30000 });
  }

  async mightContain(value) {
    const response = await this.client.post("/mightContain", { value });
    return response.data?.mightContain;
  }

  async seed(values) {
    await this.client.post("/seed", { values }, { timeout: 30000 });
  }

  async addEmail(email) {
    await this.client.post("/addEmail", { email }, { timeout: 30000 });
  }

  async emailMightContain(email) {
    const response = await this.client.post("/emailMightContain", { email });
    return response.data?.mightContain;
  }
}

export const bloomFilter = new BloomFilterService();

export default BloomFilterService;