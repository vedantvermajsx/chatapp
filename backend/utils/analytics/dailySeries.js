import { dayKey } from './dayKey.js';

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export async function dailySeries(Model, field, since, days = 30) {
  const rows = await Model.aggregate([
    { $match: { [field]: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: `$${field}`, timezone: TZ } },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(rows.map((row) => [row._id, row.count]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const series = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = dayKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i));
    series.push({ date: key, count: counts.get(key) || 0 });
  }
  return series;
}
