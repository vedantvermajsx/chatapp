import Guest from '../../models/guest.model.js';

async function handleGuestRegistered(userData) {
  const { _id, username } = userData;

  try {
    const guest = await Guest.create({
      ...userData,
      _id,
    });
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

export function registerGuestRegistrationHandler(subscribe, on) {
  subscribe('guest.registered');
  on('guest.registered', handleGuestRegistered);
  console.log('[GuestRegistrationProcessor] subscribed to guest.registered');
}
