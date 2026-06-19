import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

class CacheService {
  constructor() {
    this.baseUrl =process.env.CACHE_SERVICE_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("cache service:", this.baseUrl);
  }

  async set(key, value, ttl) {
    await this.client.post("/", { key, value, ttl });
  }

  async get(key) {
    try {
      const response = await this.client.get(
        `/${encodeURIComponent(key)}`
      );
      return response.data.value;
    } catch (err) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async delete(key) {
    try {
      const response = await this.client.delete(
        `/${encodeURIComponent(key)}`
      );
      return response.status >= 200 && response.status < 300;
    } catch (err) {
      return false;
    }
  }

  async clear() {
    await this.client.delete("/");
  }
}

export const cache = new CacheService();
export default CacheService;