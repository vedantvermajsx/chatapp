const KEY = 'chatBackgroundImage';
const SETTINGS_KEY = 'chatBackgroundSettings';
const MAX_SIDE = 1600;
const QUALITY = 0.8;

export const DEFAULT_CHAT_BG_SETTINGS = { blur: 5, opacity: 20, contrast: 100 };

export function getChatBackground() {
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
}

export function getChatBackgroundSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_CHAT_BG_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_CHAT_BG_SETTINGS };
  } catch {
    return { ...DEFAULT_CHAT_BG_SETTINGS };
  }
}

export function setChatBackgroundSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* storage unavailable */ }
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
