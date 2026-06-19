import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  groupAdmin: { type: String, required: true },
  groupName: { type: String, required: true, unique: true },
  groupDescription: { type: String, required: true },
  groupPic: { type: String, default: 'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1781261557/UI__15-1024-195514528_vf6uwo.avif' },
  groupMembers: { type: Array, default: [] }
}, { timestamps: true });

export default mongoose.models.Room || mongoose.model('Room', roomSchema);