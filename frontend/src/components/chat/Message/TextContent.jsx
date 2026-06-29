function TextContent({ text, textColor, bubbleBg }) {
  if (!text) return null;
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
