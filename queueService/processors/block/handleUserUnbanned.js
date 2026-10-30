import Ban from '../../models/ban.model.js';

export async function handleUserUnbanned({ userId }) {
  if (!userId) return;
  await Ban.deleteOne({ userId: String(userId) });
}
