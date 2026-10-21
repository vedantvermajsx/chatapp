import { publish, INSTANCE_ID } from '../../utils/messageBroker.js';
import { processSignal } from '../../utils/callSessions.js';

const handleWebrtcSignal = (socket, io) => async (payload) => {
  try {
    const { targetId, type, data, callerData } = payload;
    const senderId = String(socket.user._id || socket.user.id);

    if (!targetId || !type) {
      return;
    }

    const payloadToEmit = {
      targetId,
      senderId,
      type,
      data,
      callerData,
      callId: payload.callId,
      origin: INSTANCE_ID
    };

    // Tracks the call, assigns payloadToEmit.callId on an offer, buffers the offer/ICE for
    // 45s, always sends the data-only `call` push on an offer, and sends `call-cancel`
    // pushes when the call is cancelled/rejected. Must run before emit/publish.
    processSignal(payloadToEmit);

    io.to(String(targetId)).emit('webrtcSignal', payloadToEmit);

    publish('webrtcSignal', payloadToEmit);
  } catch (err) {
    console.error('Error handling WebRTC signal:', err.message);
  }
};

export default handleWebrtcSignal;
