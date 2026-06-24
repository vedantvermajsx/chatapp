import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


class CloudinaryService {
  uploadBuffer(buffer, options = {}, isAvatar = false) {
    if (isAvatar) {
      options.format = 'avif';
    }
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  getMediaMeta(mimetype) {
    if (mimetype.startsWith('video/')) {
      return { mediaType: 'video', resourceType: 'video' };
    } else if (mimetype.startsWith('audio/')) {
      return { mediaType: 'audio', resourceType: 'video' };
    } else if (mimetype === 'image/gif') {
      return { mediaType: 'gif', resourceType: 'image' };
    }
    return { mediaType: 'image', resourceType: 'image' };
  }
}

export const cloudinaryService = new CloudinaryService();
