import User from '../../models/user.model.js';
import Guest from '../../models/guest.model.js';

export async function getRoomAdminNames(roomAdminIds = []) {
  const ids = [...new Set(roomAdminIds.filter(Boolean))];
  if (!ids.length) return new Map();

  const [users, guests] = await Promise.all([
    User.find({ _id: { $in: ids } }, 'username').lean(),
    Guest.find({ _id: { $in: ids } }, 'username').lean(),
  ]);

  return new Map([...users, ...guests].map((doc) => [String(doc._id), doc.username]));
}
