import mongoose from 'mongoose';

export const generateGuestId = () => `guest_${new mongoose.Types.ObjectId().toString()}`;
export const generateUserId = () => new mongoose.Types.ObjectId().toString();