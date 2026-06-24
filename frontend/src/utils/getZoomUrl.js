const getZoomUrl = (url) => {
  if (!url?.includes('res.cloudinary.com')) return url;

  return url.replace(
    '/upload/',
    '/upload/f_auto,q_auto,w_1600/'
  );
};

export default getZoomUrl;