const CHESS_INVITE = /^Join the chess game with code: (\d{4})$/;
const EMOJI_RE = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*|[\u{1F1E6}-\u{1F1FF}]{2})/gu;
const EMOJI_ONLY = /^(?:\p{Extended_Pictographic}|\uFE0F|\u200D|[\u{1F3FB}-\u{1F3FF}]|[\u{1F1E6}-\u{1F1FF}]|\s)+$/u;

export const isEmojiOnly = (text) => !!text && text.length <= 40 && EMOJI_ONLY.test(text) && /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u.test(text);

const EMOJI_STYLE = { fontSize: '1.4em', lineHeight: 1 };

function renderWithEmoji(str, keyPrefix) {
  return str.split(EMOJI_RE).map((chunk, i) =>
    i % 2 === 1 ? <span key={`${keyPrefix}-${i}`} style={EMOJI_STYLE}>{chunk}</span> : chunk
  );
}

function TextContent({ text, textColor, bubbleBg, accent, isOwn = false }) {
  if (!text) return null;

  const invite = text.match(CHESS_INVITE);
  if (invite) {
    const code = invite[1];
    return (
      <div>
        <p className="text-[15px] leading-[1.4]" style={{ color: textColor }}>
          ♞ Join the chess game with code: <span className="font-bold tracking-widest">{code}</span>
        </p>
        {!isOwn && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-chess', { detail: { code } }))}
            className="mt-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: accent || textColor, color: accent ? '#fff' : bubbleBg }}
          >
            Join game
          </button>
        )}
      </div>
    );
  }

  if (isEmojiOnly(text)) {
    return <p className="leading-[1.2] break-words whitespace-pre-wrap" style={{ fontSize: '2.1rem' }}>{text}</p>;
  }

  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);

  return (
    <p className="text-[14px] md:text-[15px] leading-[1.4] break-words whitespace-pre-wrap" style={{ color: textColor }}>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="font-medium px-1 rounded" style={{ backgroundColor: 'rgba(88,101,242,0.25)' }}>
            {part}
          </span>
        ) : (
          renderWithEmoji(part, i)
        )
      )}
    </p>
  );
}

export default TextContent;
