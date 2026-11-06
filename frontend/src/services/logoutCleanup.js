import keyManager from './keyManager';
import { blockDB, clearAllStores, hardResetDB } from './indexedDB/core.js';

// Everything the app keeps in localStorage except the theme preference.
const LOCAL_KEYS_TO_REMOVE = ['token', 'user', 'ban', 'gatherup.downloads.v1'];

const step = async (label, fn, failures) => {
  try {
    await fn();
  } catch (err) {
    failures.push(label);
    console.error(`[logout wipe] ${label} failed:`, err);
  }
};

/**
 * Removes every chat-related thing stored on this device.
 * Safe to call more than once. Returns true when every step succeeded.
 */
export async function wipeLocalChatData({ queryClient } = {}) {
  const failures = [];

  // 1. Credentials first, so nothing can make an authenticated request any more.
  try {
    LOCAL_KEYS_TO_REMOVE.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    failures.push('localStorage');
  }

  // 2. Encryption keys + all stores, then lock the DB so late socket events can't refill it,
  //    then delete the whole database file.
  await step('keys', () => keyManager.clear(), failures);
  await step('stores', () => clearAllStores(), failures);
  blockDB();
  await step('database', () => hardResetDB(), failures);

  // 3. In-memory caches.
  try { queryClient?.clear(); } catch { failures.push('queryClient'); }

  // 4. Let in-memory UI state (downloads list etc.) reset itself.
  window.dispatchEvent(new Event('chat:wiped'));

  return failures.length === 0;
}
