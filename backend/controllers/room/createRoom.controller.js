import mongoose from 'mongoose';
import roomCacheClient from '../../database/roomCacheClient.js';
import { enqueueRoomCreation } from '../../utils/queueClient.js';

export async function createRoom(req, res) {
  try {
    const { groupName, groupDescription } = req.body;
    if (!groupName || !groupDescription) {
      return res.status(400).json({ message: 'Name and description required' });
    }

    const exists = await roomCacheClient.getRoomByName(groupName);
    if (exists) {
      return res.status(409).json({ message: 'Room name already taken' });
    }

    const groupAdmin = req.user._id;
    const roomId = new mongoose.Types.ObjectId().toString();
    const now = new Date();

    const roomData = {
      _id: roomId,
      groupAdmin,
      groupName,
      groupDescription,
      groupPic:
        'https://res.cloudinary.com/dfxi4ihfs/image/upload/w_50,h_50,c_fill/v1781261557/UI__15-1024-195514528_vf6uwo.avif',
      groupMembers: [groupAdmin],
      createdAt: now,
      updatedAt: now,
    };

    enqueueRoomCreation({ room: roomData, creatorId: groupAdmin });

    await roomCacheClient.addRoomToCache(roomId, roomData);
    roomCacheClient.addRoomMember(roomId, groupAdmin);

    const io = req.app.get('io');
    const { onlineUsers } = await import('../../socket.js');
    const creatorEntry = onlineUsers.get(String(groupAdmin));

    if (io && creatorEntry?.socketId) {
      const creatorSocket = io.sockets.sockets.get(creatorEntry.socketId);
      if (creatorSocket) {
        creatorSocket.join(roomId);
      }
    }

   // console.log('room created', roomData.groupName);
    res.status(201).json({ message: 'Room created successfully', room: roomData });
  } catch (err) {
    console.error('[createRoom] unexpected error:', err.message);
    res.status(500).json({ message: err.message });
  }
}
