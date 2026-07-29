import userCacheClient from "../../database/userCacheClient.js";

export async function getUserProfile(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await userCacheClient.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = {
      pfp: user.avatar ?? "",
      username: user.username,
      bio: user.bio ?? "",
      gender: user.gender,
    };

    return res.status(200).json({ message: "User fetched successfully", user: profile });
  } catch (error) {
    console.error("Error in getUserProfile controller:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
}
