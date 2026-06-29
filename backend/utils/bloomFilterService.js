import axios from "axios";
import dotenv from "dotenv";
import { attachHmacInterceptor } from "./hmacClient.js";
dotenv.config();

class BloomFilterService {
  constructor() {
    this.baseUrl =process.env.BLOOM_FILTER_SERVICE_URL;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
    attachHmacInterceptor(this.client);

    console.log("Bloom Filter Service:", this.baseUrl);
  }

  async add(value) {
    await this.client.post("/add", { value });
  }

  async remove(value) {
    await this.client.post("/remove", { value });
  }

  async mightContain(value) {
    const response = await this.client.post("/mightContain", { value });
    return response.data?.mightContain;
  }

  async seed(values) {
    await this.client.post("/seed", { values });
  }

  async addEmail(email) {
    await this.client.post("/addEmail", { email });
  }

  async emailMightContain(email) {
    const response = await this.client.post("/emailMightContain", { email });
    return response.data?.mightContain;
  }
}

export const bloomFilter = new BloomFilterService();

export default BloomFilterService;