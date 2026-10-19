import { dbService } from './indexedDB.service';

const previewUrls = new Map();

const getPreviewUrl = async (record) => {
  if (previewUrls.has(record.id)) return previewUrls.get(record.id);
  const file = await dbService.getFile(record.mediaId);
  if (!file) return null;
  const url = URL.createObjectURL(file);
  previewUrls.set(record.id, url);
  return url;
};

const keyOf = (p) => (p.type === 'room' ? `room_${p.roomId}` : `private_${p.receiverId}`);

// Pending (unsent) messages are never saved with the chat history, so after an app restart they'd be
// invisible until sent. Re-adds them from the pending store so they show with their upload loader.
export const withPendingMessages = async (cacheKey, list, messageCache = null) => {
  const base = list || [];
  try {
    const pending = (await dbService.getPendingMessages()).filter((p) => keyOf(p) === cacheKey);
    if (!pending.length) return base;

    const have = new Set(base.map((m) => String(m.id || m._id)));
    const extra = [];

    for (const p of pending) {
      if (have.has(String(p.id))) continue;

      let media = p.media || null;
      if (media && p.mediaId && media.isPending !== false) {
        const url = await getPreviewUrl(p);
        if (!url) continue; // file is gone - the resume logic will drop this message
        media = { ...media, url, isPending: true };
      }

      extra.push({
        id: p.id,
        text: p.text,
        isOwn: true,
        timestamp: p.timestamp,
        username: p.username,
        avatar: p.avatar || null,
        gender: p.gender,
        media,
        uploadProgress: media?.isPending ? 0 : null,
        isPending: true,
      });
    }

    if (!extra.length) return base;
    const merged = [...base, ...extra];
    if (messageCache?.current?.[cacheKey]) {
      messageCache.current[cacheKey] = { ...messageCache.current[cacheKey], messages: merged };
    }
    return merged;
  } catch (error) {
    console.error('Failed to merge pending messages:', error);
    return base;
  }
};
