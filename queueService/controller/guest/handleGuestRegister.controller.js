import Guest from "../../models/user.model.js";
import mongoose from "mongoose";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const cache = axios.create({
  baseURL: process.env.CACHE_SERVICE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 3000,
});

export async function handleGuestRegistered(userData) {
  const { _id, username } = userData;

  try {
    const guest = await Guest.create({
      ...userData,
      _id: new mongoose.Types.ObjectId(_id),
    });
    console.log(`[GuestRegistrationProcessor] created guest ${guest._id} (${username})`);

    try {
      await cache.post("/users/seed", guest.toObject());
    } catch (cacheErr) {
      console.warn(
        `[GuestRegistrationProcessor] cache seed failed for ${guest._id}:`,
        cacheErr.message
      );
    }
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`[GuestRegistrationProcessor] duplicate guest ignored: ${username}`);
      return;
    }
    console.error(`[GuestRegistrationProcessor] failed to create guest ${username}:`, err.message);
    throw err;
  }
}
