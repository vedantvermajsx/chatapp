import keyManager from './keyManager';
import { blockDB, clearAllStores, hardResetDB } from './indexedDB/core.js';
import pushService from './push.service';

const LOCAL_KEYS_TO_REMOVE = ['token', 'user', 'ban', 'gatherup.downloads.v1', 'chatBackgroundImage'];

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

  await step('push', () => pushService.disable(), failures);

  try {
    LOCAL_KEYS_TO_REMOVE.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    failures.push('localStorage');
  }

  await step('keys', () => keyManager.clear(), failures);
  await step('stores', () => clearAllStores(), failures);
  blockDB();
  await step('database', () => hardResetDB(), failures);

  try { queryClient?.clear(); } catch { failures.push('queryClient'); }

  window.dispatchEvent(new Event('chat:wiped'));

  return failures.length === 0;
}
