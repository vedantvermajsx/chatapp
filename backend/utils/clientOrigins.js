// Tauri webview origins (Windows/Android: http(s)://tauri.localhost, macOS/Linux/iOS: tauri://localhost)
export const TAURI_ORIGINS = [
  'http://tauri.localhost',
  'https://tauri.localhost',
  'tauri://localhost',
];

const clean = (s) => s.trim().replace(/\/+$/, '');

export const getClientOrigins = () => {
  const list = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(clean).filter(Boolean);
  return [...new Set([...list, ...TAURI_ORIGINS])];
};
