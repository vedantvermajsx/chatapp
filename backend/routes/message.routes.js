import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware.js';
import { sendRoomMessage } from '../controllers/message/sendRoomMessage.controller.js';
import { sendPrivateMessage } from '../controllers/message/sendPrivateMessage.controller.js';
import { getRoomMessages } from '../controllers/message/getRoomMessages.controller.js';
import { getPrivateMessages } from '../controllers/message/getPrivateMessages.controller.js';
import { getPrivateChats } from '../controllers/message/getPrivateChats.controller.js';
import { uploadMedia } from '../controllers/message/upload.controller.js';

const SUPPORTED_FORMATS = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
};

const ALL_FORMATS = [...SUPPORTED_FORMATS.image, ...SUPPORTED_FORMATS.video, ...SUPPORTED_FORMATS.audio];

const fileFilter = (req, file, cb) => {
  const isSupported = ALL_FORMATS.includes(file.mimetype);
  
  if (!isSupported) {
    cb(new Error(`Format "${file.mimetype}" is not supported!`), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
});

const router = Router();

router.post('/send', authenticate, sendRoomMessage);
router.post('/private/send', authenticate, sendPrivateMessage);
router.post('/upload', authenticate, upload.single('file'), uploadMedia);
router.get('/room/:roomId', authenticate, getRoomMessages);
router.get('/private/:otherUserId', authenticate, getPrivateMessages);
router.get('/private', authenticate, getPrivateChats);

export default router;
