const DAY_MS = 24 * 60 * 60 * 1000;

const BAN_PRESETS = [
  { label: '1 day', ms: DAY_MS },
  { label: '3 days', ms: 3 * DAY_MS },
  { label: '7 days', ms: 7 * DAY_MS },
  { label: '1 month', ms: 30 * DAY_MS },
  { label: '3 months', ms: 90 * DAY_MS },
  { label: '1 year', ms: 365 * DAY_MS },
];

export default BAN_PRESETS;
