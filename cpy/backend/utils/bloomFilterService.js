import axios from "axios";
import dotenv from "dotenv";
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

    console.log("Bloom Filter Service:", this.baseUrl);
  }

  async add(value) {
    await this.client.post("/add", { value });
  }

  async mightContain(value) {
    const response = await this.client.post("/mightContain", { value });
    return response.data?.mightContain;
  }

  async seed(values) {
    await this.client.post("/seed", { values });
  }
}

export const bloomFilter = new BloomFilterService();

export default BloomFilterService;