import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { cloudinaryService } from '../../utils/cloudinary.utils.js';
dotenv.config();

export async function getUploadSignature(req, res) {
  try {
    const { folder = 'data', type = '', size } = req.query;
    const maxSize = cloudinaryService.getMaxFileSize(type);
    if (size !== undefined && Number(size) > maxSize) {
      return res.status(413).json({ message: `File size exceeds the ${maxSize / 1024 / 1024}MB limit` });
    }
    const targetFolder = ['avatar', 'data'].includes(folder) ? folder : 'data';
    const timestamp = Math.round((new Date()).getTime() / 1000);

    const paramsToSign = {
      timestamp: timestamp,
      folder: targetFolder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      folder: targetFolder,
      max_size: maxSize,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error('getUploadSignature error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate signature' });
  }
}
