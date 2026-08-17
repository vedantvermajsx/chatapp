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

  const registrationTokens = (tokens || []).map((t) => t.token).filter(Boolean);
  if (!registrationTokens.length) return;

  const stringData = toStringMap(data);

  try {
    const response = await admin.messaging(app).sendEachForMulticast({
      tokens: registrationTokens,
      notification: { title, body },
      data: stringData,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });

    response.responses.forEach((res, i) => {

      console.log(res);
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
 * Sends the same push notification to multiple users in parallel.
 */
export async function sendPushToUsers(userIds = [], payload) {
  const uniqueIds = [...new Set(userIds.map(String))];
  await Promise.all(uniqueIds.map((id) => sendPushToUser(id, payload)));
}

export function isPushConfigured() {
  return !!getFirebaseApp();
}
