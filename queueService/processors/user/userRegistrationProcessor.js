import User from '../../models/user.model.js';

export async function handleUserRegistered(userData) {
  const { username, email } = userData;

  try {
    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      console.warn(`[UserRegistrationProcessor] user already exists, skipping: ${username}`);
      return;
    }

    await User.create(userData);
  //  console.log(`[UserRegistrationProcessor] created user (${username})`);
  } catch (err) {
    if (err.code === 11000) {
      console.warn(
        `[UserRegistrationProcessor] duplicate user ignored: ${username} / ${email}`
      );
      return;
    }
    console.error(`[UserRegistrationProcessor] failed to create user ${username}:`, err.message);
    throw err;
  }
}
