import admin from 'firebase-admin';
import deviceTokenCacheClient from '../database/deviceTokenCacheClient.js';

let firebaseApp = null;
let initTried = false;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  if (initTried) return null;
  initTried = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    console.warn('[push] FIREBASE_SERVICE_ACCOUNT not set — push notifications are disabled');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[push] firebase-admin initialized for project:', serviceAccount.project_id);
  } catch (err) {
    console.error('[push] Failed to initialize firebase-admin:', err.message);
    firebaseApp = null;
  }

  return firebaseApp;
}

function toStringMap(data = {}) {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === 'string' ? value : String(value);
  }
  return out;
}

function collapseTag(data = {}) {
  if (data.type === 'room' && data.roomId) return `room_${data.roomId}`;
  if (data.type === 'private' && data.senderId) return `private_${data.senderId}`;
  return 'chat';
}

/**
 * Sends a push notification to every registered device of a single user.
 * Silently no-ops if push isn't configured or the user has no tokens.
 *
 * @param {string} userId
 * @param {{ title: string, body: string, data?: object }} payload
 */
export async function sendPushToUser(userId, { title, body, data = {} } = {}) {
  const app = getFirebaseApp();
  if (!app || !userId) return;

  let tokens = [];
  try {
    tokens = await deviceTokenCacheClient.getTokens(userId);
  } catch (err) {
    console.error('[push] getTokens error:', err.message);
    return;
  }

  const registrationTokens = [
    ...new Set((tokens || []).map((t) => t.token).filter(Boolean)),
  ];
  if (!registrationTokens.length) return;

  const stringData = toStringMap(data);
  const tag = collapseTag(stringData);

  try {
    const response = await admin.messaging(app).sendEachForMulticast({
      tokens: registrationTokens,
      notification: { title, body },
      data: stringData,
      android: { priority: 'high', collapseKey: tag },
      apns: {
        headers: { 'apns-collapse-id': tag },
        payload: { aps: { sound: 'default' } },
      },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          title,
          body,
          tag,
          renotify: true,
          icon: '/icon.png',
          badge: '/icon.png',
        },
      },
    });

    response.responses.forEach((res, i) => {
      if (res.success) return;
      const code = res.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        deviceTokenCacheClient
          .removeToken(userId, registrationTokens[i])
          .catch(() => {});
      } else {
        console.error(`[push] send failed for user ${userId}:`, code || res.error?.message);
      }
    });
  } catch (err) {
    console.error('[push] sendEachForMulticast error:', err.message);
  }
}

/**
 * Data-only push (no `notification` block) so the app's background handler always runs
 * and can render its own UI (e.g. a Notifee full-screen call notification).
 * Used for `call` and `call-cancel`.
 *
 * @param {string} userId
 * @param {object} data  string-mappable key/values; must include `type`
 * @param {{ ttlSeconds?: number, collapseKey?: string }} [opts]
 */
export async function sendDataPushToUser(userId, data = {}, { ttlSeconds = 60, collapseKey } = {}) {
  const app = getFirebaseApp();
  if (!app || !userId) return;

  let tokens = [];
  try {
    tokens = await deviceTokenCacheClient.getTokens(userId);
  } catch (err) {
    console.error('[push] getTokens error:', err.message);
    return;
  }

  const registrationTokens = [
    ...new Set((tokens || []).map((t) => t.token).filter(Boolean)),
  ];
  if (!registrationTokens.length) return;

  const stringData = toStringMap(data);
  const tag = collapseKey || collapseTag(stringData);
  // apns-collapse-id is limited to 64 bytes
  const apnsCollapseId = tag.slice(0, 64);

  try {
    const response = await admin.messaging(app).sendEachForMulticast({
      tokens: registrationTokens,
      data: stringData,
      android: {
        priority: 'high',
        ttl: ttlSeconds * 1000, // firebase-admin: milliseconds
        collapseKey: tag,
      },
      apns: {
        headers: {
          'apns-push-type': 'background',
          'apns-priority': '5',
          'apns-collapse-id': apnsCollapseId,
          'apns-expiration': String(Math.floor(Date.now() / 1000) + ttlSeconds),
        },
        payload: { aps: { 'content-available': 1 } },
      },
      webpush: {
        headers: { Urgency: 'high', TTL: String(ttlSeconds) },
      },
    });

    response.responses.forEach((res, i) => {
      if (res.success) return;
      const code = res.error?.code;
      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        deviceTokenCacheClient
          .removeToken(userId, registrationTokens[i])
          .catch(() => {});
      } else {
        console.error(`[push] data send failed for user ${userId}:`, code || res.error?.message);
      }
    });
  } catch (err) {
    console.error('[push] data sendEachForMulticast error:', err.message);
  }
}

/**
 * Sends the same push notification to multiple users in parallel.
 */
export async function sendPushToUsers(userIds = [], payload) {
  const uniqueIds = [...new Set(userIds.map(String))];
  await Promise.all(uniqueIds.map((id) => sendPushToUser(id, payload)));
}

export function isPushConfigured() {
  return !!getFirebaseApp();
}
