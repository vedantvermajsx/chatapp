import { generateGuestId } from '../../utils/idGenerator.js';
import { handleAuthSuccess } from './auth.helper.js';
import { isUsernameTaken } from './usernameTaken.js';
import { enqueueGuestRegistration } from '../../utils/queueClient.js';
import { getDefaultAvatar } from '../../utils/getDefaultAvtar.js';
import userCacheClient from '../../database/userCacheClient.js';

export async function createGuest(req, res) {
  try {
    const { username, gender, dob } = req.body;

    const refactoredUsername = username?.trim().toLowerCase();

    if (!refactoredUsername) {
      return res.status(400).json({ message: 'Username is required' });
    }
    if(gender===undefined || gender===null || gender<0 || gender>2){
         return res.status(400).json({message:"Invalid gender !"});
    }

    if (!dob) {
      return res.status(400).json({ message: 'dob required' });
    }
    if (refactoredUsername.length < 2 || refactoredUsername.length > 30) {
      return res.status(400).json({ message: 'Username must be 2–30 characters' });
    }

    const taken = await isUsernameTaken(refactoredUsername);
    if (taken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const guestId = generateGuestId();
    const defaultAvatar = getDefaultAvatar(gender);

    const guestData = {
      _id: guestId,
      username: refactoredUsername,
      gender: Number(gender),
      dob: new Date(dob),
      avatar: defaultAvatar,
      isOnline: true,
      lastSeen: new Date(),
    };

    enqueueGuestRegistration(guestData);

    userCacheClient.seedUser({ _id: guestId, ...guestData }).catch(err => {
      console.warn('[createGuest] Failed to seed guest cache:', err.message);
    });

    await handleAuthSuccess(res, { _id: guestId, ...guestData }, 'guest');
  } catch (err) {
    console.error('[createGuest] unexpected error:', err.message);
    res.status(500).json({ message: err.message });
  }
}
