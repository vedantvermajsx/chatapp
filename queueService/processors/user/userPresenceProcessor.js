import User from '../../models/user.model.js';
import Guest from '../../models/guest.model.js';

const isGuestId = (id) => String(id).startsWith('guest_');

async function setPresence(userId, isOnline, lastSeen) {
  if (!userId) return;

  const Model = isGuestId(userId) ? Guest : User;
  const seenAt = lastSeen ? new Date(lastSeen) : new Date();

  try {
    await Model.findByIdAndUpdate(userId, {
      $set: { isOnline, lastSeen: seenAt },
    });
   // console.log(`[UserPresenceProcessor] ${userId} -> isOnline:${isOnline} @ ${seenAt.toISOString()}`);
  } catch (err) {
    console.error(`[UserPresenceProcessor] failed to set presence for ${userId}:`, err.message);
  }
}

export async function handleUserOffline({ userId, lastSeen }) {
  return setPresence(userId, false, lastSeen);
}

export async function handleUserOnline({ userId, lastSeen }) {
  return setPresence(userId, true, lastSeen);
}
