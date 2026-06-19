import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CACHE_SERVICE_URL = process.env.CACHE_SERVICE_URL;

const client = axios.create({
  baseURL: CACHE_SERVICE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 5000
});

console.log('[QueueService] cache service:', CACHE_SERVICE_URL);

export async function invalidateMessageCache({ roomId, senderId, receiverId }) {
  try {
    await client.post('/messages/invalidate', { roomId, senderId, receiverId });
  } catch (err) {
    console.error(
      '[QueueService] failed to invalidate message cache:',
      err.response?.data?.message || err.message
    );
  }
}
