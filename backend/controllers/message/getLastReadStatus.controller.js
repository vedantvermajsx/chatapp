import lastReadCacheClient from '../../database/lastReadCacheClient.js';

export const getLastReadStatus = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const { user } = req;
    const userId = user._id;

    const theirReadReceipt = await lastReadCacheClient.get(otherUserId, `private_${userId}`);

    const lastRead = {
      messageId: theirReadReceipt?.messageId ?? null,
      seenAt: theirReadReceipt?.lastSeenAt ?? null,
    };

    res.status(200).json({ lastRead });
  } catch (error) {
    console.error('Error getting last read status:', error);
    res.status(500).json({ message: 'Failed to get last read status', error: error.message });
  }
};
