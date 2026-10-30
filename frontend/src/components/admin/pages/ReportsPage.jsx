import { useTheme } from '../../../contexts/ThemeContext';
import ReportsPanel from '../ReportsPanel';

export default function ReportsPage() {
  const { theme } = useTheme();
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: theme.otherMessageBubble }}>
      <ReportsPanel accent={theme.myMessageBubble} />
    </div>
  );
}
