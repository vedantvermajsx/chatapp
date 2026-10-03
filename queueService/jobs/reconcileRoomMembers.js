import Room from '../models/room.model.js';
import User from '../models/user.model.js';
import Guest from '../models/guest.model.js';
import UserRoom from '../models/userRoom.model.js';

let suspects = new Set();

export async function reconcileRoomMembers() {
  const rooms = await Room.find({ isDeleted: { $ne: true } }, { groupMembers: 1 }).lean();
  const allIds = new Set();
  for (const r of rooms) for (const id of r.groupMembers || []) allIds.add(String(id));
  if (!allIds.size) return;

  const ids = [...allIds];
  const [users, guests] = await Promise.all([
    User.find({ _id: { $in: ids } }, { _id: 1 }).lean(),
    Guest.find({ _id: { $in: ids } }, { _id: 1 }).lean(),
  ]);
  const alive = new Set([...users, ...guests].map((d) => String(d._id)));
  const missing = ids.filter((id) => !alive.has(id));

  const confirmed = missing.filter((id) => suspects.has(id));
  suspects = new Set(missing);
  if (!confirmed.length) return;

  await Room.updateMany({ groupMembers: { $in: confirmed } }, { $pullAll: { groupMembers: confirmed } });
  await UserRoom.deleteMany({ userId: { $in: confirmed } });
  console.log(`[ReconcileRoomMembers] removed ${confirmed.length} ghost member(s) from rooms`);
}

export function startRoomMemberReconciler(intervalMs = 30 * 60 * 1000) {
  const run = () => reconcileRoomMembers().catch((e) => console.error('[ReconcileRoomMembers] failed:', e.message));
  setTimeout(run, 60 * 1000).unref?.();
  setInterval(run, intervalMs).unref?.();
}
