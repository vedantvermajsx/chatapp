/**
 * Applies a private-chat read receipt ({ messageId, seenAt }) to a message
 * list: marks ONLY the message whose id matches as seen, and clears the
 * seen flag from any other message that previously had it (e.g. the read
 * pointer moved forward to a newer message).
 *
 * We deliberately do not mark every message older than some timestamp as
 * seen — only the exact message the other person's client told us about.
 */
export function applyLastRead(messages, lastRead) {
  if (!messages?.length) return messages;

  const messageId = lastRead?.messageId != null ? String(lastRead.messageId) : null;
  const seenAt = lastRead?.seenAt ?? null;

  let changed = false;
  const next = messages.map((msg) => {
    const id = String(msg.id ?? msg._id);

    if (messageId && msg.isOwn && id === messageId) {
      if (msg.isSeen && msg.seenAt === seenAt) return msg;
      changed = true;
      return { ...msg, isSeen: true, seenAt };
    }

    if (msg.isSeen) {
      changed = true;
      return { ...msg, isSeen: false, seenAt: null };
    }

    return msg;
  });

  return changed ? next : messages;
}
