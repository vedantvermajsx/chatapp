import userCacheClient from "../../database/userCacheClient.js";

async function getActivityStatus(req, res){

    try {

        const userId = req.query.userId;
        const user = await userCacheClient.getUserById(userId);

        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }
        
        const response = {
            lastSeen: user.lastSeen,
            isOnline: user.isOnline
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