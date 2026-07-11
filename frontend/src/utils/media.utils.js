export function _addQualities(data) {
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
