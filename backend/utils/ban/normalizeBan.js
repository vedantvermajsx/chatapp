export function normalizeBan(ban) {
  return {
    userId: String(ban.userId),
    username: ban.username || null,
    reason: ban.reason || '',
    expiresAt: ban.expiresAt ? Number(ban.expiresAt) : null,
  };
}
