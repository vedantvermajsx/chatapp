import { useTheme } from '../../contexts/ThemeContext';

export default function StatCard({ icon: Icon, label, value, sub, accent }) {
  const { theme } = useTheme();
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ backgroundColor: theme.otherMessageBubble }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: theme.muted }}>{label}</span>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <span className="text-2xl font-bold" style={{ color: theme.otherMessageText }}>{value}</span>
      {sub && <span className="text-xs" style={{ color: theme.muted }}>{sub}</span>}
    </div>
  );
}
