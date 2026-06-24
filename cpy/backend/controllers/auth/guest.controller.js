import bcrypt from 'bcryptjs';
import Guest from '../../models/guest.model.js';
import { getDefaultAvatar, handleAuthSuccess} from './auth.helper.js';
import { isUsernameTaken } from './usernameTaken.js';

export async function createGuest(req, res) {
  try {
    const { username, gender, age } = req.body;
    
    const refactoredUsername=username.trim().toLowerCase()
    

    if (!refactoredUsername) {
      return res.status(400).json({ message: 'Username is required' });
    }
    if (gender === undefined || !age) {
      return res.status(400).json({ message: 'Gender and age required' });
    }

    if (refactoredUsername.length < 2 || refactoredUsername.length > 30) {
      return res.status(400).json({ message: 'Username must be 2–30 characters' });
    }


    const taken = await isUsernameTaken(refactoredUsername);
    if(taken){
      return res.status(400).json({ message: 'Username already taken' });
    }


    const defaultAvatar = getDefaultAvatar(gender);

    const hashed = await bcrypt.hash(Math.random().toString(36), 10);
    const guest = await Guest.create({
      username: refactoredUsername,
      gender: Number(gender),
      age: Number(age),
      password: hashed,
      avatar: defaultAvatar
    });


    await handleAuthSuccess(res, guest, 'guest');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
