import User from '../../models/user.model.js';
import Guest from '../../models/guest.model.js';
import {bloomFilter} from '../../utils/bloomFilterService.js';

export async function isUsernameTaken(username) {
  const normalized = username.toLowerCase();

  if (!(await bloomFilter.mightContain(normalized))) {
    return false;
  }

  const [user, guest] = await Promise.all([
    User.findOne({ username: normalized }).select('_id').lean(),
    Guest.findOne({ username: normalized }).select('_id').lean()
  ]);

  return !!(user || guest);
}