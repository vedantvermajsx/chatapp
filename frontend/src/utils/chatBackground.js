// Custom chat background image. Stored per-browser as a downscaled JPEG data URL so it
// survives reloads and fits localStorage limits.
const KEY = 'chatBackgroundImage';
const MAX_SIDE = 1600;
const QUALITY = 0.8;

export function getChatBackground() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function clearChatBackground() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
    img.src = url;
  });
}

// Resolves to the saved data URL; rejects with a user-readable Error.
export async function setChatBackground(file) {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Please choose an image file');
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
  try {
    localStorage.setItem(KEY, dataUrl);
  } catch {
    throw new Error('Image is too large to save in this browser');
  }
  return dataUrl;
}
