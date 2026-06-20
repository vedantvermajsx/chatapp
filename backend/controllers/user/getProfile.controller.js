import userCacheClient from "../../database/userCacheClient.js";

export async function getProfile(req, res) {
  try {
    const userId = req.user._id;
    
    const user = await userCacheClient.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({message: "User fetched successfully", user});

  } catch (error) {
    console.log("Error in getProfile controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
