// One-off: swap senderId/receiverId on every ConversationRead doc.
// Old queueService wrote {senderId: reader, receiverId: peer}; the cache reads
// {senderId: peer, receiverId: reader}. Run ONCE, after deploying the fixed queueService.
//
//   MONGO_URI=... node scripts/migrate-conversationread.js          (dry run)
//   MONGO_URI=... node scripts/migrate-conversationread.js --apply
//
// Swapping is a permutation of the (sender, receiver) pairs, so the unique index can't
// collide. It writes to a new collection and renames, so nothing is half-migrated.
// Back up the collection first (mongodump --collection conversationreads).
import mongoose from 'mongoose';

const apply = process.argv.includes('--apply');
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const src = db.collection('conversationreads');
const total = await src.countDocuments();
console.log(`${total} docs to swap (${apply ? 'APPLY' : 'dry run'})`);
if (!apply) process.exit(0);

await db.collection('conversationreads_swapped').drop().catch(() => {});
await src.aggregate([
  { $addFields: { senderId: '$receiverId', receiverId: '$senderId' } },
  { $out: 'conversationreads_swapped' },
]).toArray();
const swapped = db.collection('conversationreads_swapped');
await swapped.createIndex({ senderId: 1, receiverId: 1 }, { unique: true });
await swapped.createIndex({ receiverId: 1 });
await src.rename('conversationreads_backup_' + Date.now());
await swapped.rename('conversationreads');
console.log('done; original kept as conversationreads_backup_*');
process.exit(0);
