import User from '../../models/user.model.js';
import Guest from '../../models/guest.model.js';
import userCache from "../../database/userCache.js";

export const getActivityStatus = async (req, res) => {

    try {

        const user = await userCache.getUserById(req.query.userId);

        
        const response = {};
        if (user) {
            response.lastSeen = user.lastSeen;
            response.isOnline = user.isOnline;
        }
        else {
            let dbUser;
            if (req.query.userId.startsWith('guest_')) {
                dbUser = await Guest.findById(req.query.userId);
            } else {
                dbUser = await User.findById(req.query.userId);
            }
            response.lastSeen = dbUser?.lastSeen;
            response.isOnline = dbUser?.isOnline;
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