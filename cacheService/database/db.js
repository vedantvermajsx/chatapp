import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let connectingPromise = null;

// The cache service connects to the SAME MongoDB cluster/database the
// queue service writes to. It never writes to the messages collection
// itself - this connection exists purely to serve cache-miss reads.
export const connectDB = async () => {
  if (isConnected) return;
  if (connectingPromise) return connectingPromise;

  connectingPromise = mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      isConnected = true;
      connectingPromise = null;
      console.log('[CacheService] connected to MongoDB');
    })
    .catch((err) => {
      connectingPromise = null;
      console.error('[CacheService] MongoDB connection error:', err.message);
      throw err;
    });

  return connectingPromise;
};
