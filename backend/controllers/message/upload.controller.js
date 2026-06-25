import { cloudinaryService } from '../../utils/cloudinary.utils.js';
import { ALL_SUPPORTED_FORMATS } from '../../utils/constants.js';
import getThumbnailUrl from '../../utils/getThumbnail.js';

export async function uploadMedia(req, res) {
  try {
    console.log('uploadMedia called:', {
      hasFile: !!req.file,
      fileDetails: req.file ? {
        mimetype: req.file.mimetype,
        size: req.file.size,
        originalname: req.file.originalname
      } : null,
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!ALL_SUPPORTED_FORMATS.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        message: `Format "${req.file.mimetype}" is not supported!` 
      });
    }

    const { folder } = req.body;
    const targetFolder = ['avatar', 'data'].includes(folder) ? folder : 'data';

    const { mimetype, buffer } = req.file;
    const { mediaType, resourceType } = cloudinaryService.getMediaMeta(mimetype);

    console.log('Uploading to Cloudinary:', {
      mimetype,
      mediaType,
      resourceType,
      targetFolder
    });

    const isAvatar = targetFolder === 'avatar';
    const result = await cloudinaryService.uploadBuffer(buffer, {
      folder: targetFolder,
      resource_type: resourceType,
    }, isAvatar);

    console.log('Cloudinary upload success:', result.public_id);

    res.json({
      url: result.secure_url,
      thumbnailUrl: getThumbnailUrl(result.secure_url),
      type: mediaType
    });
  } catch (err) {
    console.error('uploadMedia error:', {
      message: err.message,
      stack: err.stack,
      ...err
    });
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
}
