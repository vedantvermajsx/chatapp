export const SUPPORTED_FORMATS = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
};

export const ALL_SUPPORTED_FORMATS = [...SUPPORTED_FORMATS.image, ...SUPPORTED_FORMATS.video, ...SUPPORTED_FORMATS.audio];
