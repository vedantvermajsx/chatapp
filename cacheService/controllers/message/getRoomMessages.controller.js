import { getRoomMessages as getRoomMessagesService } from '../../services/MessageCacheService.js';

function mapRoomMessage(msg) {
  const formatted = {
    _id: msg._id || msg.id,
    text: msg.content,
    timestamp: msg.timestamp,
    senderId: msg.senderId,
    taggedUser: msg.taggedUser || null,
  };
  if (msg.media){
    formatted.media = msg.media;
    
  }
  if(msg.isSystemMessage){
    formatted.isSystemMessage = true;
    formatted.systemType = msg.systemType;
  }
  return formatted;
}

export const getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 20, before, after ,userId} = req.query;

    const result = await getRoomMessagesService({
      roomId,
      userId,
      limit,
      before,
      after,
      mapMessage: mapRoomMessage,
    });

    res.json(result);
  } catch (error) {
    console.error('[CacheService] error getting room messages:', error);
    res.status(500).json({ message: 'Failed to get room messages', error: error.message });
  }
};
