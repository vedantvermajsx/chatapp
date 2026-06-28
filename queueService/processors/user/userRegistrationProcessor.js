import User from '../../models/user.model.js';

async function handleUserRegistered(userData) {
  const { _id, username, email } = userData;

  try {
    await User.create(userData);
    console.log(`[UserRegistrationProcessor] created user ${_id} (${username})`);
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`[UserRegistrationProcessor] duplicate user ignored: ${username} / ${email}`);
      return;
    }
    console.error(`[UserRegistrationProcessor] failed to create user ${username}:`, err.message);
    throw err;
  }
}

export function registerUserRegistrationHandler(subscribe, on) {
  subscribe('user.registered');
  on('user.registered', handleUserRegistered);
  console.log('[UserRegistrationProcessor] subscribed to user.registered');
}
