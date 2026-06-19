import mongoose from 'mongoose';
import Room from '../models/room.model.js';
import { setupGuestChangeStream } from '../models/guest.model.js';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    setupGuestChangeStream();

    const rooms = await Room.find({});
    for (const room of rooms) {
      const unique = [...new Set(room.groupMembers.map(String))];
      if (unique.length !== room.groupMembers.length) {
        await Room.findByIdAndUpdate(room._id, { groupMembers: unique });
      }
    }
    console.log('Room cleanup complete');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
