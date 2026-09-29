const CHESS_INVITE = /^Join the chess game with code: (\d{4})$/;

function TextContent({ text, textColor, bubbleBg, isOwn = false }) {
  if (!text) return null;

  const invite = text.match(CHESS_INVITE);
  if (invite) {
    const code = invite[1];
    return (
      <div className="mt-0.5">
        <p className="text-[14px] md:text-[15px] leading-snug" style={{ color: textColor }}>
          ♞ Join the chess game with code: <span className="font-bold tracking-widest">{code}</span>
        </p>
        {!isOwn && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-chess', { detail: { code } }))}
            className="mt-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: textColor, color: bubbleBg }}
          >
            Join game
          </button>
        )}
      </div>
    );
  }

  const parts = text.split(/(@[a-zA-Z0-9_.-]+)/g);
  
  return (
    <p className="text-[14px] md:text-[15px] leading-snug break-words whitespace-pre-wrap mt-0.5" style={{ color: textColor }}>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={i}
              className="font-bold px-1 rounded mx-0.5"
              style={{
                backgroundColor: textColor,
                color: bubbleBg
              }}
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
}

export default TextContent;
