import User from '../../models/user.model.js';

export async function getGenderBreakdown() {
  const rows = await User.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]);

  const breakdown = { male: 0, female: 0, other: 0 };
  for (const row of rows) {
    if (row._id === 0) breakdown.male += row.count;
    else if (row._id === 1) breakdown.female += row.count;
    else breakdown.other += row.count;
  }
  return breakdown;
}
