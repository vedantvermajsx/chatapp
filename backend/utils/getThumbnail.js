const getThumbnailUrl = (url, isVideo = false, isAudio = false) => {
  if (!url?.includes('res.cloudinary.com')) return url;

  if (isAudio) return null;

  if (isVideo) {
    return url
      .replace('/upload/', '/upload/so_0,f_jpg,w_200,c_fill/')
      .replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.jpg');
  }

  return url.replace(
    '/upload/',
    '/upload/f_auto,q_auto,w_200,c_limit/'
  );
};

export default getThumbnailUrl;