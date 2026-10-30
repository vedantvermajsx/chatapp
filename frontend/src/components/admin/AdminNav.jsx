import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { ADMIN_NAV } from './tabs';

export default function AdminNav() {
  const { theme } = useTheme();
  const accent = theme.myMessageBubble;

  return (
    <nav
      className="flex flex-wrap items-center gap-1 p-1 rounded-2xl"
      style={{ backgroundColor: theme.otherMessageBubble }}
    >
      {ADMIN_NAV.map(({ id, label, path, Icon, end }) => (
        <NavLink
          key={id}
          to={path}
          end={end}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
          style={({ isActive }) => ({
            backgroundColor: isActive ? accent : 'transparent',
            color: isActive ? theme.onPrimary : theme.otherMessageText,
          })}
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
