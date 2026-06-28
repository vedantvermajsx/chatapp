import Room from '../../models/room.model.js';
import UserRoom from '../../models/userRoom.model.js';
import mongoose from 'mongoose';

export async function getJoinedRooms(req, res) {
  try {
    const userId = req.user._id;

    let userRoom = await UserRoom.findOne({ userId }).lean();

    const roomIds = userRoom?.roomIds ?? null;

    if (!roomIds || roomIds.length === 0) {
      return res.json({data:[], hasMore:false});
    }


    const objectRoomIds = roomIds.map(id => new mongoose.Types.ObjectId(id));    
   
    const joinedRooms = await Room.aggregate([
  {
    $match: {
      _id: { $in: objectRoomIds }
    }
  },
  {
    $sort: {
      updatedAt: -1
    }
  },
  {
    $project: {
      _id: 1,
      groupName: 1,
      groupDescription: 1,
      groupAdmin: 1,
      groupPic: 1,
      createdAt: 1,
      updatedAt: 1,
      memberCount: {
        $size: {
          $ifNull: ["$groupMembers", []]
        }
      }
    }
  }
]);

    console.log("joined rooms",joinedRooms);

    return res.json({data:joinedRooms, hasMore:false});
  } catch (err) {
    console.error('[getJoinedRooms] error:', err);
    res.status(500).json({ message: err.message });
  }
}
