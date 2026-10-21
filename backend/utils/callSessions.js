import { randomUUID } from 'crypto';
import { sendDataPushToUser } from './pushNotifications.js';

/**
 * Pending-call state.
 *
 * FCM payloads are far too small for an SDP, so the push only *wakes* the callee's
 * device. The offer and the caller's ICE candidates are held here for 45 seconds and
 * flushed to the callee as soon as their socket joins.
 *
 * Every backend instance keeps its own copy of this state. The origin instance (the one
 * the caller's socket is on) calls processSignal(payload) and owns the side effects
 * (pushes). Other instances receive the same signal through the broker and call
 * processSignal(payload, { mirror: true }), so the buffer exists wherever the callee
 * happens to connect, but only one instance ever sends a push.
 */

export const CALL_BUFFER_TTL_MS = 45 * 1000;
const MAX_BUFFERED_SIGNALS = 150;
const CALL_PUSH_TTL_SECONDS = 45;
const CANCEL_PUSH_TTL_SECONDS = 60;

// Signal `type` values sent by the clients. Adjust here if the app uses different names.
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

// key = `${callerId}:${calleeId}` -> session
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

/**
 * Deliver everything buffered for `userId` (the callee) to this socket, in order.
 * Each pending call is replayed at most once per instance.
 */
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

/** The ringing (unanswered) call from callerId to calleeId, if any. */
export function getPendingCall(callerId, calleeId) {
  const session = sessions.get(keyOf(String(callerId), String(calleeId)));
  return session ? { callId: session.callId, callerId: session.callerId, calleeId: session.calleeId } : null;
}
