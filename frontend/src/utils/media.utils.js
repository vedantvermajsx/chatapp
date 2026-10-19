export function _addQualities(data) {
  if (!data.url || data.type === 'gif') {
    return data;
  }
  data.thumbnail = data.url.replace("/upload", "/upload/fl_lossy,q_20,w_200").replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.avif');
  data.low = data.url.replace("/upload", "/upload/fl_lossy,q_40").replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.avif');
  data.mid = data.url.replace("/upload", "/upload/fl_lossy,q_60").replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.avif');
  data.hd = data.url.replace("/upload", "/upload/fl_lossy,q_100").replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.avif');

  return data;
}

export function getMediaMeta(mimetype) {
  if (mimetype.startsWith('video/')) {
    return { mediaType: 'video', resourceType: 'video' };
  } else if (mimetype.startsWith('audio/')) {
    return { mediaType: 'audio', resourceType: 'video' };
  } else if (mimetype === 'image/gif') {
    return { mediaType: 'gif', resourceType: 'image' };
  }
  return { mediaType: 'image', resourceType: 'image' };
}

// Cloudinary free plan: 100MB for video/audio, 10MB for everything else
export function getMaxFileSize(mimetype = '') {
  const { resourceType } = getMediaMeta(mimetype);
  return (resourceType === 'video' ? 100 : 10) * 1024 * 1024;
}
