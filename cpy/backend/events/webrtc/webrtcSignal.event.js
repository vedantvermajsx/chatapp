import { publish } from '../../utils/messageBroker.js';

const handleWebrtcSignal = (socket, io) => async (payload) => {
  try {
    const { targetId, type, data, callerData } = payload;
    const senderId = socket.user.id;

    if (!targetId || !type) {
      return;
    }

    const payloadToEmit = {
      targetId,
      senderId,
      type,
      data,
      callerData
    };

    io.to(String(targetId)).emit('webrtcSignal', payloadToEmit);

    publish('webrtcSignal', payloadToEmit);
    
  } catch (err) {
    console.error('Error handling WebRTC signal:', err.message);
  }
};

export default handleWebrtcSignal;
