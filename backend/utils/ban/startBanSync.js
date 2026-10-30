import { refreshBans } from './refreshBans.js';

export function startBanSync(intervalMs = 15000) {
  refreshBans();
  const timer = setInterval(refreshBans, intervalMs);
  timer.unref?.();
}
