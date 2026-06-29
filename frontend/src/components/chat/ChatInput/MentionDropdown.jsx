import Avatar from '../../common/Avatar';

export default function MentionDropdown({
  mentionQuery,
  isMentionLoading,
  mentionSuggestions,
  theme,
  mentionIndex,
  setMentionIndex,
  insertMention,
  mentionListRef
}) {
  if (mentionQuery === null || (!isMentionLoading && mentionSuggestions.length === 0)) {
    return null;
  }

  return (
    <ul
      ref={mentionListRef}
      role="listbox"
      aria-label="Mention suggestions"
      className="absolute left-0 right-0 bottom-full mb-1 mx-2 sm:mx-6 rounded-xl overflow-hidden z-50"
      style={{
        backgroundColor: theme.cardBackground || theme.background,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
        border: `1px solid ${theme.isLight ? '#e2e8f0' : '#374151'}`,
      }}
    >
      {isMentionLoading && mentionSuggestions.length === 0 ? (
        [0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-2.5 animate-pulse">
            <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: theme.isLight ? '#e2e8f0' : '#374151' }} />
            <div className="h-3 rounded flex-1" style={{ backgroundColor: theme.isLight ? '#e2e8f0' : '#374151', maxWidth: `${60 + i * 15}%` }} />
          </li>
        ))
      ) : (
        mentionSuggestions.map((member, idx) => (
          <li
            key={member._id || member.id || member.username}
            role="option"
            aria-selected={idx === mentionIndex}
            onMouseDown={(e) => {
              e.preventDefault();
              insertMention(member.username);
            }}
            onMouseEnter={() => setMentionIndex(idx)}
            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none"
            style={{
              backgroundColor: idx === mentionIndex
                ? (theme.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)')
                : 'transparent',
            }}
          >
            <div className="flex-shrink-0">
              <Avatar
                url={member.avatar}
                name={member.username}
                gender={member.gender}
                size={8}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span
                className="text-sm font-semibold truncate"
                style={{ color: theme.otherMessageText }}
              >
                @{member.username}
              </span>
            </div>
            {isMentionLoading && idx === mentionSuggestions.length - 1 && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: theme.otherUsernameColor }} />
            )}
          </li>
        ))
      )}
    </ul>
  );
}
