import mongoose from 'mongoose';

const joinedRoomSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        roomId: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Room',
            },
        ],
    },
    { timestamps: true }
);

joinedRoomSchema.statics.getJoinedRoom = async function (userId) {
    return await this.findOne({ userId });
};

joinedRoomSchema.statics.addRoom = async function (userId, roomId) {
    return await this.findOneAndUpdate(
        { userId },
        {
            $addToSet: {
                roomId,
            },
        },
        {
            upsert: true,
            new: true,
        }
    );
};

joinedRoomSchema.statics.removeRoom = async function (userId, roomId) {
    return await this.updateOne(
        { userId},
        {
            $pull: {
                roomId,
            },
        }
    );
};

joinedRoomSchema.statics.hasJoined = async function (userId, roomId) {
    const exists = await this.exists({
        userId,
        roomId,
    });

    return !!exists;
};

export default mongoose.models.JoinedRoom ||
    mongoose.model('JoinedRoom', joinedRoomSchema);