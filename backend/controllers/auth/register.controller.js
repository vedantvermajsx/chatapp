import bcrypt from 'bcryptjs';
import User from '../../models/user.model.js';
import { getDefaultAvatar, handleAuthSuccess} from './auth.helper.js';
import { isUsernameTaken } from './usernameTaken.js';

export async function register(req, res) {
  try {
    const { username, password, gender, age, bio} = req.body;

    const refactoredUsername=username.trim().toLowerCase()

    if (!refactoredUsername || !password || gender === undefined || !age) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (refactoredUsername.length < 2 || refactoredUsername.length > 30) {
      return res.status(400).json({ message: 'Username must be 2–30 characters' });
    }

    const taken = await isUsernameTaken(refactoredUsername);
    if(taken){
      return res.status(400).json({ message: 'Username already taken' });
    }

    const avatar = getDefaultAvatar(gender);

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashed,
      gender: gender.toString(),
      age: Number(age),
      bio: bio || '',
      avatar: avatar
    });

    await handleAuthSuccess(res, user, 'user');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
