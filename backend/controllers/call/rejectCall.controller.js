import { getIO } from '../../socket.js';
import { publish, INSTANCE_ID } from '../../utils/messageBroker.js';
import { getPendingCall, processSignal } from '../../utils/callSessions.js';

/**
 * POST /api/calls/reject   (auth required: the authenticated user is the callee)
 * body: { callerId: string, callId?: string }
 *
 * Lets the app decline a call over HTTP when it was woken by the push and has no socket
 * yet (e.g. "Decline" tapped on the notification). Tells the caller's client the call was
 * rejected and sends a `call-cancel` push so the callee's other devices stop ringing.
 * Idempotent: a repeat or late reject is a no-op for the push.
 */
export async function rejectCall(req, res) {
  try {
    const calleeId = String(req.user._id);
    const callerId = String(req.body?.callerId || req.body?.senderId || '');
    const callId = typeof req.body?.callId === 'string' ? req.body.callId : undefined;

    if (!callerId || callerId.length > 64) {
      return res.status(400).json({ success: false, message: 'callerId is required' });
    }
    if (callerId === calleeId) {
      return res.status(400).json({ success: false, message: 'Invalid callerId' });
    }
    if (callId && callId.length > 64) {
      return res.status(400).json({ success: false, message: 'Invalid callId' });
    }

    const pending = getPendingCall(callerId, calleeId);

    // A stale reject for an older call must not kill a newer one.
    if (pending && callId && pending.callId !== callId) {
      return res.status(200).json({ success: true, active: false });
    }

    const payload = {
      targetId: callerId,
      senderId: calleeId,
      type: 'reject',
      data: { reason: 'rejected' },
      callId: callId || pending?.callId,
      origin: INSTANCE_ID,
    };

    // Clears the buffer and sends the call-cancel push to the callee's devices.
    processSignal(payload);

    const io = getIO();
    if (io) io.to(callerId).emit('webrtcSignal', payload);
    publish('webrtcSignal', payload);

    return res.status(200).json({ success: true, active: !!pending });
  } catch (error) {
    console.error('[rejectCall] error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
