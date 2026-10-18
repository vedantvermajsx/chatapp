import apiClient from './api';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const SW_URL = '/firebase-messaging-sw.js';
const TOKEN_KEY = 'push-token';

let messagingInstance = null;
let foregroundUnsub = null;
let swRegistration = null;

function isConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      VAPID_KEY
  );
}

function isBrowserSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

async function getMessagingInstance() {
  if (messagingInstance) return messagingInstance;
  if (!isConfigured() || !isBrowserSupported()) return null;

  const [{ initializeApp, getApps, getApp }, { getMessaging, isSupported }] = await Promise.all([
    import('firebase/app'),
    import('firebase/messaging'),
  ]);

  if (!(await isSupported())) return null;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

async function registerServiceWorker() {
  if (swRegistration?.active) return swRegistration;

  const params = new URLSearchParams(
    Object.entries(firebaseConfig).filter(([, value]) => Boolean(value))
  );
  let registration = await navigator.serviceWorker.register(`${SW_URL}?${params.toString()}`);

  if (!registration.active) {
    registration = await withTimeout(navigator.serviceWorker.ready, 15000, 'service-worker-timeout');
  }

  swRegistration = registration;
  return registration;
}

function getPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function isEnabled() {
  return getPermission() === 'granted' && Boolean(getStoredToken());
}

async function requestPermission() {
  if (getPermission() === 'unsupported') return 'unsupported';
  return Notification.requestPermission();
}

/**
 * Requests permission, obtains an FCM web token and registers it for the current user.
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
async function enable() {
  try {
    if (!isBrowserSupported()) return { ok: false, reason: 'unsupported' };
    if (!isConfigured()) return { ok: false, reason: 'config' };

    const permission = await requestPermission();
    if (permission !== 'granted') return { ok: false, reason: permission };

    const messaging = await getMessagingInstance();
    if (!messaging) return { ok: false, reason: 'unsupported' };

    const registration = await registerServiceWorker();
    const { getToken } = await import('firebase/messaging');
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return { ok: false, reason: 'token' };

    await apiClient.post('/users/device-token', { token, platform: 'web' });
    localStorage.setItem(TOKEN_KEY, token);
    return { ok: true };
  } catch (err) {
    console.error('[push] enable failed:', err);
    return { ok: false, reason: err?.message || 'error' };
  }
}

/**
 * Unregisters the current device token from FCM and the backend.
 */
async function disable() {
  const token = getStoredToken();

  try {
    const messaging = await getMessagingInstance();
    if (messaging) {
      const { deleteToken } = await import('firebase/messaging');
      await deleteToken(messaging);
    }
  } catch (err) {
    console.error('[push] deleteToken failed:', err.message);
  }

  if (token) {
    try {
      await apiClient.delete('/users/device-token', { data: { token } });
    } catch (err) {
      console.error('[push] unregister token failed:', err.message);
    }
  }

  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Re-registers the stored token for whoever is currently logged in (e.g. after an
 * account switch). Never prompts — only runs when permission is already granted.
 */
async function syncToken() {
  if (getPermission() !== 'granted' || !isConfigured()) return;
  await enable();
}

/**
 * Singleton foreground listener — shows through the app while the tab is focused.
 * @param {(payload: object) => void} handler
 * @returns {Promise<() => void>} unsubscribe
 */
async function watchForeground(handler) {
  const messaging = await getMessagingInstance();
  if (!messaging || foregroundUnsub) return () => {};

  const { onMessage } = await import('firebase/messaging');
  foregroundUnsub = onMessage(messaging, handler);
  return () => {
    foregroundUnsub?.();
    foregroundUnsub = null;
  };
}

export default {
  isConfigured,
  isSupported: isBrowserSupported,
  getPermission,
  isEnabled,
  enable,
  disable,
  syncToken,
  watchForeground,
};
