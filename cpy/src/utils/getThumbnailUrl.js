const getThumbnailUrl = (url) => {
  if (!url?.includes('res.cloudinary.com')) return url;

  return url.replace(
    '/upload/',
    '/upload/f_auto,q_auto,w_300,c_limit/'
  );
};

export default getThumbnailUrl;