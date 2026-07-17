import userCacheClient from "../../database/userCacheClient.js";
import User from "../../models/user.model.js";

export async function getProfile(req, res) {
  try {
    const userId = req.user._id;
    
    let user = {
      _id: userId,
      username: req.user.username,
      avatar: req.user.avatar,
      gender: req.user.gender,
      isOnline: req.user.isOnline,
      lastSeen: req.user.lastSeen,
      age: null,
      bio: '',
    };

    try {
      const cachedUser = await userCacheClient.getUserById(userId);
      if (cachedUser) {
        user = { ...user, ...cachedUser };
      } else {
        const dbUser = await User.findById(userId);
        if (dbUser) {
          user = {
            _id: String(dbUser._id),
            username: dbUser.username,
            avatar: dbUser.avatar,
            gender: dbUser.gender,
            age: dbUser.age,
            bio: dbUser.bio,
            isOnline: dbUser.isOnline,
            lastSeen: dbUser.lastSeen,
          };
          userCacheClient.addUserToCache(userId, Promise.resolve(user)).catch(() => {});
        }
      }
    } catch (err) {
      console.warn("getProfile cache/DB error:", err.message);
    }

    const profile = {
      _id: String(user._id),
      username: user.username,
      avatar: user.avatar,
      gender: user.gender,
      age: user.age,
      bio: user.bio,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    };

    res.status(200).json({ message: "User fetched successfully", user: profile });

  } catch (error) {
    console.log("Error in getProfile controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
