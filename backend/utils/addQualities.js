export function _addQualities(data){
  if(!data.url || data.type === 'gif'){
    return data;
  }
  data.thumbnail=data.url.replace("/upload", "/upload/fl_lossy,q_20,w_200").replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.avif');
  data.low=data.url.replace("/upload", "/upload/fl_lossy,q_40").replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.avif');
  data.mid=data.url.replace("/upload", "/upload/fl_lossy,q_60").replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.avif');
  data.hd=data.url.replace("/upload", "/upload/fl_lossy,q_100").replace(/\.(mp4|mov|avi|webm|mkv)$/i, '.avif');
 
  return data;
}