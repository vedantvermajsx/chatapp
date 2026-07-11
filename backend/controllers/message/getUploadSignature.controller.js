import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { publitioService } from '../../utils/publitio.utils.js';
dotenv.config();

export async function getUploadSignature(req, res) {
  try {
    const { folder = 'data', provider = 'cloudinary' } = req.query;
    
    if (provider === 'publitio') {
      const targetFolder = ['avatar', 'data'].includes(folder) ? folder : 'data';
      const uploadUrl = publitioService.getUploadUrl({ folder: targetFolder });
      
      res.json({
        uploadUrl,
        provider: 'publitio'
      });
    } else {
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
        api_key: process.env.CLOUDINARY_API_KEY,
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        provider: 'cloudinary'
      });
    }
  } catch (err) {
    console.error('getUploadSignature error:', err);
    res.status(500).json({ message: err.message || 'Failed to generate signature' });
  }
}
