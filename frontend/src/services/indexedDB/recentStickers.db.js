import { STORES, MAX_RECENT_STICKERS, openDB, promisifyRequest } from './core.js';

// Recently used stickers + GIFs, newest first, capped at MAX_RECENT_STICKERS combined.
// Each row also keeps the image bytes (when the CDN allows it) so the Recent tab works with no internet.

const MAX_BLOB_BYTES = 3 * 1024 * 1024;
const keyOf = (type, url) => `${type}|${url}`;
const isValidType = (t) => t === 'sticker' || t === 'gif';

const runTx = async (fn) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.recentStickers, 'readwrite');
    let result;
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
    try { result = fn(tx.objectStore(STORES.recentStickers)); } catch (err) { try { tx.abort(); } catch {} reject(err); }
  });
};

export const dbRecentStickers = {
  // Mark a sticker/GIF as just used (adds it, or moves it to the top). Evicts the oldest beyond the cap.
  async addRecentSticker({ type, url, title }) {
    if (!url || !isValidType(type)) return;
    const key = keyOf(type, url);
    await runTx((store) => {
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        const existing = getReq.result;
        store.put({ ...(existing || {}), key, type, url, title: title || existing?.title || '', usedAt: Date.now() });

        const countReq = store.count();
        countReq.onsuccess = () => {
          let excess = countReq.result - MAX_RECENT_STICKERS;
          if (excess <= 0) return;
          const cursorReq = store.index('usedAt').openCursor(); // oldest first
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor && excess > 0) {
              excess -= 1;
              cursor.delete();
              cursor.continue();
            }
          };
        };
      };
    });
  },

  // Best-effort: download the image once so it can be shown offline. Silently skipped if the CDN blocks it.
  async cacheRecentStickerBlob(type, url) {
    if (!url || !isValidType(type)) return false;
    const key = keyOf(type, url);
    try {
      const db = await openDB();
      const row = await promisifyRequest(db.transaction(STORES.recentStickers).objectStore(STORES.recentStickers).get(key));
      if (!row || row.blob) return !!row?.blob;

      const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) return false;
      const blob = await res.blob();
      if (!blob.size || blob.size > MAX_BLOB_BYTES) return false;

      await runTx((store) => {
        const getReq = store.get(key);
        getReq.onsuccess = () => {
          if (getReq.result) store.put({ ...getReq.result, blob });
        };
      });
      return true;
    } catch {
      return false;
    }
  },

  // Newest first.
  async getRecentStickers() {
    try {
      const db = await openDB();
      const rows = await promisifyRequest(
        db.transaction(STORES.recentStickers).objectStore(STORES.recentStickers).getAll()
      );
      return (rows || []).sort((a, b) => b.usedAt - a.usedAt);
    } catch {
      return [];
    }
  },

  async clearRecentStickers() {
    await runTx((store) => { store.clear(); });
  },
};
