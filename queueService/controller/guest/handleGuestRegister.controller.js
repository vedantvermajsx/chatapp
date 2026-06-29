import Guest from "../../models/user.model.js";
import mongoose from "mongoose";


export async function handleGuestRegistered(userData) {
  const {username } = userData;

  try {
    if(!username || username.trim().length===0) return;
     
    const existingGuest = await Guest.findByUsername(username);
    
    if (existingGuest) return;

    const guest = await Guest.create(userData);
    console.log(`[GuestRegistrationProcessor] created guest ${guest._id} (${username})`);

  } catch (err) {
    if (err.code === 11000) {
      console.warn(`[GuestRegistrationProcessor] duplicate guest ignored: ${username}`);
      return;
    }
    console.error(`[GuestRegistrationProcessor] failed to create guest ${username}:`, err.message);
    throw err;
  }
}
