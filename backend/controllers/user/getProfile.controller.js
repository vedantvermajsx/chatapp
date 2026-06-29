import userCacheClient from "../../database/userCacheClient.js";

export async function getProfile(req, res) {
  try {
    const userId = req.user._id;
    
    const user = await userCacheClient.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
