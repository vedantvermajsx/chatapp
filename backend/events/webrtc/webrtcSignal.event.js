import { publish, INSTANCE_ID } from '../../utils/messageBroker.js';
import { onlineUsers } from '../../socket.js';
import { sendPushToUser } from '../../utils/pushNotifications.js';

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
      origin: INSTANCE_ID
    };

    io.to(String(targetId)).emit('webrtcSignal', payloadToEmit);

    publish('webrtcSignal', payloadToEmit);

    if (type === 'offer' && !onlineUsers.has(String(targetId))) {
      const callerName = callerData?.username || 'Someone';
      const isVideo = !!callerData?.isVideo;
      sendPushToUser(String(targetId), {
        title: callerName,
        body: isVideo ? 'Incoming video call' : 'Incoming voice call',
        data: { type: 'call', senderId, isVideo },
      }).catch((err) => console.error('[webrtc] call push error:', err.message));
    }
  } catch (err) {
    console.error('Error handling WebRTC signal:', err.message);
  }
};

export default handleWebrtcSignal;