import roomCacheClient from '../../database/roomCacheClient.js';
import ConversationKey from '../../models/conversationKey.model.js';

export async function getRoomKey(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const isMember = await roomCacheClient.hasMember(roomId, userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Not a member of this room' });
    }

    const grant = await ConversationKey
      .findOne({ conversationId: roomId, conversationType: 'room', userId })
      .select('+wrappedKey');

    return res.json({ wrappedKey: grant?.wrappedKey ?? null });
  } catch (err) {
    console.error('[getRoomKey] error:', err.message);
    return res.status(500).json({ message: err.message });
  }
}
