import { useTheme } from '../../../contexts/ThemeContext';
import BansPanel from '../BansPanel';

export default function BansPage() {
  const { theme } = useTheme();
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: theme.otherMessageBubble }}>
      <BansPanel />
    </div>
  );
}
