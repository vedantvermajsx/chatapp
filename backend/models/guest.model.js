import mongoose from "mongoose";
import { generateGuestId } from "../utils/idGenerator.js";
import Room from "./room.model.js";
import userCacheClient from "../database/userCacheClient.js";

const guestScheme = new mongoose.Schema({
    _id: {
        type: String,
        default: generateGuestId
    },
    username: { type: String, required: true, unique: true },
    gender:   { type: Number, required: true },
    age:      { type: Number, required: true },
    password: { type: String, required: true },
    avatar:   { type: String, required: false },
    isOnline: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

guestScheme.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

async function cleanupGuestData(guestDoc) {
    try {
        const guestId = guestDoc._id;
        await Room.updateMany(
            { groupMembers: guestId },
            { $pull: { groupMembers: guestId } }
        );
        await userCacheClient.deleteUserById(guestId);
    } catch (error) {
        console.error('Error cleaning up guest data:', error);
    }
}

guestScheme.post('remove', async function(doc) {
    await cleanupGuestData(doc);
});

guestScheme.post('deleteOne', async function(doc) {
    if (doc) await cleanupGuestData(doc);
});


let changeStream;
export function setupGuestChangeStream() {
    if (changeStream) return;

    changeStream = Guest.watch([
        { $match: { operationType: 'delete' } },
        { $project: { documentKey: 1, fullDocumentBeforeChange: 1 } }
    ], { fullDocumentBeforeChange: 'whenAvailable' });

    changeStream.on('change', async (change) => {
        const guestDoc = change.fullDocumentBeforeChange || change.documentKey;
        if (guestDoc) await cleanupGuestData(guestDoc);
    });

    changeStream.on('error', (error) => {
        console.error('Guest change stream error:', error);
    });
}


const Guest = mongoose.models.Guest || mongoose.model("Guest", guestScheme);

export default Guest;