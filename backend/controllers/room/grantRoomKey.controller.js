import roomCacheClient from '../../database/roomCacheClient.js';
import ConversationKey from '../../models/conversationKey.model.js';

export async function grantRoomKey(req, res) {
  try {
    const { roomId, userId: targetUserId } = req.params;
    const { wrappedKey } = req.body;
    const callerId = req.user._id;

    if (!wrappedKey) {
      return res.status(400).json({ message: 'wrappedKey is required' });
    }

    const [callerIsMember, targetIsMember] = await Promise.all([
      roomCacheClient.hasMember(roomId, callerId),
      roomCacheClient.hasMember(roomId, targetUserId),
    ]);

    if (!callerIsMember) {
      return res.status(403).json({ message: 'Not a member of this room' });
    }
    if (!targetIsMember) {
      return res.status(400).json({ message: 'Target user is not a member of this room' });
    }

    // Whoever gets there first wins; don't clobber a grant that already
    // exists (e.g. another member raced this one).
    const existing = await ConversationKey.findOne({
      conversationId: roomId,
      conversationType: 'room',
      userId: targetUserId,
    });
    if (existing) {
      return res.status(200).json({ message: 'Key already granted' });
    }

    try {
      await ConversationKey.create({
        conversationId: roomId,
        conversationType: 'room',
        userId: targetUserId,
        wrappedKey,
      });
    } catch (err) {
      if (err.code !== 11000) throw err; // lost the race, that's fine
    }

    return res.status(201).json({ message: 'Room key granted' });
  } catch (err) {
    console.error('[grantRoomKey] error:', err.message);
    return res.status(500).json({ message: err.message });
  }
}
