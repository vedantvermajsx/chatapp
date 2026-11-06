import { isTauri } from '@tauri-apps/api/core';
import { toast } from 'sonner';

/**
 * Desktop (Tauri) notifications for incoming chat messages.
 *
 * The window can be hidden to the system tray; the socket keeps running, so messages still
 * arrive and a native OS notification is shown. Message text is NOT put in the notification
 * (chats are end-to-end encrypted and notifications are visible on the lock screen).
 */

const THROTTLE_MS = 2500;       // max one notification per chat in this window
const OPEN_WINDOW_MS = 30000;   // coming back to the app this soon opens the chat that notified
const ASKED_AUTOSTART_KEY = 'gatherup.autostart.asked';
const PREF_KEY = 'gatherup.notifications.enabled';

const MESSAGE_SOUND_SRC = '/notification.mp3';
let messageSound = null;
const playMessageSound = () => {
  try {
    if (!messageSound) messageSound = new Audio(MESSAGE_SOUND_SRC);
    messageSound.currentTime = 0;
    messageSound.play().catch(() => {});
  } catch { /* ignore */ }
};

let pluginPromise = null;
let granted = null;
let pending = null;
const lastShown = new Map();
const targetListeners = new Set();

export const isDesktopApp = () => {
  try { return isTauri(); } catch { return false; }
};

const loadPlugin = () => {
  if (!pluginPromise) pluginPromise = import('@tauri-apps/plugin-notification');
  return pluginPromise;
};

// True only when the app window is hidden in the system tray. If the window is open in any form
// (focused, unfocused, split screen) the user can already see the app, so we don't notify.
const windowIsInTray = async () => {
  if (!isDesktopApp()) return false;
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    return !(await getCurrentWindow().isVisible());
  } catch {
    return false; // can't tell: assume it's open and stay quiet
  }
};

export async function ensureNotificationPermission() {
  if (granted === true) return true;
  try {
    if (isDesktopApp()) {
      const n = await loadPlugin();
      let ok = await n.isPermissionGranted();
      if (!ok) ok = (await n.requestPermission()) === 'granted';
      granted = ok;
      return ok;
    }
    if (typeof Notification !== 'undefined') {
      let p = Notification.permission;
      if (p === 'default') p = await Notification.requestPermission();
      granted = p === 'granted';
      return granted;
    }
  } catch (err) {
    console.error('[notifications] permission error:', err);
  }
  return false;
}

/** App-level switch (the OS permission itself can't be revoked from inside the app). */
export const isNotificationsEnabled = () => {
  try { return localStorage.getItem(PREF_KEY) !== '0'; } catch { return true; }
};

/** Turn notifications on/off. Turning on asks the OS for permission. Returns the resulting state. */
export async function setNotificationsEnabled(on) {
  if (!on) {
    try { localStorage.setItem(PREF_KEY, '0'); } catch { /* ignore */ }
    return false;
  }
  granted = null;
  const ok = await ensureNotificationPermission();
  try { localStorage.setItem(PREF_KEY, ok ? '1' : '0'); } catch { /* ignore */ }
  return ok;
}

export async function getLaunchAtLogin() {
  if (!isDesktopApp()) return false;
  try {
    const a = await import('@tauri-apps/plugin-autostart');
    return await a.isEnabled();
  } catch { return false; }
}

export async function notifyIncoming({ chatKey, title, body, target, isActiveChat }) {
  try {
    if (!isNotificationsEnabled()) return;
    // Only notify while the app is hidden in the tray; never while the window is open.
    if (!(await windowIsInTray())) return;

    const now = Date.now();
    if (now - (lastShown.get(chatKey) || 0) < THROTTLE_MS) return;
    lastShown.set(chatKey, now);

    if (!(await ensureNotificationPermission())) return;

    pending = { target, at: now };

    if (isDesktopApp()) {
      const n = await loadPlugin();
      n.sendNotification({ title, body, group: chatKey, silent: true });
    } else {
      const note = new Notification(title, { body, tag: chatKey, silent: true });
      note.onclick = () => { window.focus(); deliverTarget(); };
    }
    playMessageSound();
  } catch (err) {
    console.error('[notifications] show error:', err);
  }
}

/** Incoming call alert. Only shown while the app is hidden in the tray. */
export async function notifyIncomingCall({ callerId, username, isVideo, otherUser }) {
  try {
    if (!isNotificationsEnabled()) return;
    if (!(await windowIsInTray())) return;
    if (!(await ensureNotificationPermission())) return;

    pending = { target: { type: 'private', userId: String(callerId), otherUser }, at: Date.now() };

    const title = username || 'Incoming call';
    const body = `Incoming ${isVideo ? 'video' : 'audio'} call`;
    if (isDesktopApp()) {
      const n = await loadPlugin();
      n.sendNotification({ title, body, group: `call_${callerId}`, silent: true });
    } else {
      const note = new Notification(title, { body, tag: `call_${callerId}`, requireInteraction: true, silent: true });
      note.onclick = () => { window.focus(); deliverTarget(); };
    }
  } catch (err) {
    console.error('[notifications] call notify error:', err);
  }
}

const deliverTarget = () => {
  if (!pending) return;
  const { target, at } = pending;
  pending = null;
  if (Date.now() - at > OPEN_WINDOW_MS) return;
  targetListeners.forEach((fn) => { try { fn(target); } catch (e) { console.error(e); } });
};

// Windows toasts have no click callback in Tauri desktop, so "the window got focus right
// after a notification" is treated as the user having clicked it.
window.addEventListener('focus', deliverTarget);

/** Subscribe to "open this chat" requests coming from notifications. Returns unsubscribe. */
export function onNotificationTarget(fn) {
  targetListeners.add(fn);
  return () => targetListeners.delete(fn);
}

export async function clearDesktopNotifications() {
  pending = null;
  lastShown.clear();
  if (!isDesktopApp()) return;
  try {
    const n = await loadPlugin();
    await n.removeAllActive?.();
  } catch { /* nothing showing / unsupported */ }
}

export async function setLaunchAtLogin(enabled) {
  if (!isDesktopApp()) return false;
  const a = await import('@tauri-apps/plugin-autostart');
  if (enabled) await a.enable(); else await a.disable();
  return a.isEnabled();
}

/** Once per install: offer to start with Windows so notifications also work after a reboot. */
export async function offerLaunchAtStartup() {
  if (!isDesktopApp()) return;
  try {
    if (localStorage.getItem(ASKED_AUTOSTART_KEY)) return;
    localStorage.setItem(ASKED_AUTOSTART_KEY, '1');
    const a = await import('@tauri-apps/plugin-autostart');
    if (await a.isEnabled()) return;
    toast('Get notified even when GatherUp is closed to the tray', {
      description: 'Start GatherUp automatically when you sign in to Windows?',
      duration: 15000,
      action: { label: 'Enable', onClick: () => setLaunchAtLogin(true).catch(console.error) },
    });
  } catch (err) {
    console.error('[notifications] autostart offer error:', err);
  }
}
