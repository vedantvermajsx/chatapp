import { LayoutDashboard, Users, UserPlus, MessageSquare, Flag, ShieldBan } from 'lucide-react';

export const ADMIN_NAV = [
  { id: 'overview', label: 'Overview', path: '/admin', Icon: LayoutDashboard, end: true },
  { id: 'users', label: 'Users', path: '/admin/users', Icon: Users },
  { id: 'guests', label: 'Guests', path: '/admin/guests', Icon: UserPlus },
  { id: 'rooms', label: 'Rooms', path: '/admin/rooms', Icon: MessageSquare },
  { id: 'reports', label: 'Reports', path: '/admin/reports', Icon: Flag },
  { id: 'bans', label: 'Bans', path: '/admin/bans', Icon: ShieldBan },
];

export const REPORT_TABS = [
  { id: 'open', label: 'Open' },
  { id: 'actioned', label: 'Actioned' },
  { id: 'dismissed', label: 'Dismissed' },
];
