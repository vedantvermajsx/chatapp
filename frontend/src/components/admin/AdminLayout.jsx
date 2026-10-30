import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import AdminNav from './AdminNav';

export default function AdminLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = !!user && (user.isAdmin || user.role === 'admin');

  if (!isAdmin) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: theme.background }}>
        <Crown className="w-10 h-10" style={{ color: theme.muted }} />
        <h2 className="text-lg font-semibold" style={{ color: theme.otherMessageText }}>Admin access required</h2>
        <p className="text-sm max-w-sm" style={{ color: theme.muted }}>
          Your account does not have admin permissions. Ask an administrator to grant you access.
        </p>
        <button
          onClick={() => navigate('/chat')}
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{ backgroundColor: theme.myMessageBubble, color: theme.onPrimary }}
        >
          Back to chat
        </button>
      </div>
    );
  }

  return (
    <div className="h-dvh w-full overflow-y-auto custom-scrollbar" style={{ backgroundColor: theme.background }}>
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="p-2 rounded-full"
            style={{ backgroundColor: theme.otherMessageBubble, color: theme.otherMessageText }}
            title="Back to chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold" style={{ color: theme.otherMessageText }}>Admin</h1>
        </header>

        <AdminNav />

        <Outlet />
      </div>
    </div>
  );
}
