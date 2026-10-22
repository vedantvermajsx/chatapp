import { randomUUID } from 'crypto';
import { sendDataPushToUser } from './pushNotifications.js';

export const CALL_BUFFER_TTL_MS = 45 * 1000;
const MAX_BUFFERED_SIGNALS = 150;
const CALL_PUSH_TTL_SECONDS = 45;
const CANCEL_PUSH_TTL_SECONDS = 60;

const OFFER_TYPE = 'offer';
const ANSWER_TYPE = 'answer';
const END_TYPES = new Set([
  'end',
  'end-call',
  'hangup',
  'hang-up',
  'cancel',
  'cancel-call',
  'call-cancel',
  'reject',
  'rejected',
  'decline',
  'declined',
  'busy',
]);
const isIceType = (t) => t.includes('ice') || t.includes('candidate');

const sessions = new Map();

const keyOf = (callerId, calleeId) => `${callerId}:${calleeId}`;
const normType = (t) => String(t || '').toLowerCase();

function validCallId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 64 ? value : null;
}

function destroy(session) {
  clearTimeout(session.timer);
  if (sessions.get(session.key) === session) sessions.delete(session.key);
}

function pushCancel(session, reason) {
  sendDataPushToUser(
    session.calleeId,
    {
      type: 'call-cancel',
      callId: session.callId,
      senderId: session.callerId,
      callerName: session.callerName,
      reason,
    },
    { ttlSeconds: CANCEL_PUSH_TTL_SECONDS, collapseKey: `call_${session.callerId}` }
  ).catch((err) => console.error('[calls] call-cancel push error:', err.message));
}

function pushIncomingCall(session) {
  const data = {
    type: 'call',
    callId: session.callId,
    senderId: session.callerId,
    callerName: session.callerName,
    isVideo: session.isVideo,
  };
  if (session.callerAvatar) data.callerAvatar = session.callerAvatar;

  sendDataPushToUser(session.calleeId, data, {
    ttlSeconds: CALL_PUSH_TTL_SECONDS,
    collapseKey: `call_${session.callerId}`,
  }).catch((err) => console.error('[calls] call push error:', err.message));
}

function startSession(payload, mirror) {
  const callerId = String(payload.senderId);
  const calleeId = String(payload.targetId);
  const key = keyOf(callerId, calleeId);

  const previous = sessions.get(key);
  if (previous) destroy(previous);

  const callerData = payload.callerData || {};
  const avatar = typeof callerData.avatar === 'string' && callerData.avatar.length <= 512
    ? callerData.avatar
    : '';

  const callId = validCallId(payload.callId) || randomUUID();
  // Attach so the emitted socket payload, the buffered copy and the push all agree.
  payload.callId = callId;

  const session = {
    key,
    callId,
    callerId,
    calleeId,
    callerName: callerData.username || 'Someone',
    callerAvatar: avatar,
    isVideo: !!callerData.isVideo,
    signals: [{ ...payload }],
    flushed: false,
    timer: null,
  };

  session.timer = setTimeout(() => {
    if (sessions.get(key) !== session) return;
    destroy(session);
    if (!mirror) pushCancel(session, 'unanswered');
  }, CALL_BUFFER_TTL_MS);
  session.timer.unref?.();

  sessions.set(key, session);

  if (!mirror) pushIncomingCall(session);
}

/**
 * Feed every webrtcSignal through here.
 * For a non-mirror offer this assigns payload.callId (mutates payload), so call it
 * BEFORE emitting/publishing the payload.
 */
export function processSignal(payload, { mirror = false } = {}) {
  if (!payload) return;
  const type = normType(payload.type);
  const senderId = String(payload.senderId || '');
  const targetId = String(payload.targetId || '');
  if (!type || !senderId || !targetId || senderId === targetId) return;

  if (type === OFFER_TYPE) {
    startSession(payload, mirror);
    return;
  }

  if (type === ANSWER_TYPE) {
    // callee (sender) answered the caller (target): nothing to buffer or cancel anymore
    const session = sessions.get(keyOf(targetId, senderId));
    if (session) destroy(session);
    return;
  }

  if (END_TYPES.has(type)) {
    const asCaller = sessions.get(keyOf(senderId, targetId));
    const asCallee = sessions.get(keyOf(targetId, senderId));
    const session = asCaller || asCallee;
    if (!session) return; // already answered / expired / ended: no ringing left to cancel
    destroy(session);
    if (!mirror) pushCancel(session, session.callerId === senderId ? 'cancelled' : 'rejected');
    return;
  }

  if (isIceType(type)) {
    const session = sessions.get(keyOf(senderId, targetId));
    if (session && !session.flushed && session.signals.length < MAX_BUFFERED_SIGNALS) {
      session.signals.push({ ...payload });
    }
  }
}

export function flushBufferedSignals(socket, userId) {
  const calleeId = String(userId || '');
  if (!calleeId) return 0;

  let delivered = 0;
  for (const session of sessions.values()) {
    if (session.calleeId !== calleeId || session.flushed) continue;
    session.flushed = true;
    for (const signal of session.signals) {
      socket.emit('webrtcSignal', { ...signal, buffered: true });
      delivered += 1;
    }
    session.signals = [];
  }
  return delivered;
}

export function getPendingCall(callerId, calleeId) {
  const session = sessions.get(keyOf(String(callerId), String(calleeId)));
  return session ? { callId: session.callId, callerId: session.callerId, calleeId: session.calleeId } : null;
}
