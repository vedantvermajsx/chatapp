import { useTheme } from '../../contexts/ThemeContext';

export default function Panel({ title, action, children }) {
  const { theme } = useTheme();
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: theme.otherMessageBubble }}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: theme.otherMessageText }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
