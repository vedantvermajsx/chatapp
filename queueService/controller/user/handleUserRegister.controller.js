import User from '../../models/user.model.js';

async function handleUserRegistered(userData) {
  const {username, email } = userData;

  try {
    if(!username || username.trim().length === 0) return;
    if(!email || email.trim().length === 0) return;

    const existingUser = await User.findByUsername(username);
    if(existingUser) return;

     await User.create(userData);
    console.log(`[UserRegistrationProcessor] created user (${username})`);
  } catch (err) {
    if (err.code === 11000) {
      console.warn(`[UserRegistrationProcessor] duplicate user ignored: ${username} / ${email}`);
      return;
    }
    console.error(`[UserRegistrationProcessor] failed to create user ${username}:`, err.message);
    throw err;
  }
}

export default handleUserRegistered;
