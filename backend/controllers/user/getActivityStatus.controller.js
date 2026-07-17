import userCacheClient from "../../database/userCacheClient.js";
import User from "../../models/user.model.js";

async function getActivityStatus(req, res){
    try {
        const userId = req.query.userId;
        
        let lastSeen = new Date();
        let isOnline = false;

        try {
            const user = await userCacheClient.getUserById(userId);
            if (user) {
                lastSeen = user.lastSeen;
                isOnline = user.isOnline;
            } else {
                const dbUser = await User.findById(userId);
                if (dbUser) {
                    lastSeen = dbUser.lastSeen;
                    isOnline = dbUser.isOnline;
                }
            }
        } catch (err) {
            console.warn("getActivityStatus cache error:", err.message);
            try {
                const dbUser = await User.findById(userId);
                if (dbUser) {
                    lastSeen = dbUser.lastSeen;
                    isOnline = dbUser.isOnline;
                }
            } catch (dbErr) {
                console.warn("getActivityStatus DB error:", dbErr.message);
            }
        }

        const response = {
            lastSeen: lastSeen,
            isOnline: isOnline
        }

        return res.status(200).json({
            success: true,
            data: response
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export default getActivityStatus;