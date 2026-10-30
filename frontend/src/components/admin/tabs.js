import { Users, UserPlus, MessageSquare, Flag, ShieldBan } from 'lucide-react';

export const ADMIN_TABS = [
  { id: 'users', label: 'Users', Icon: Users },
  { id: 'guests', label: 'Guests', Icon: UserPlus },
  { id: 'rooms', label: 'Rooms', Icon: MessageSquare },
  { id: 'reports', label: 'Reports', Icon: Flag },
  { id: 'bans', label: 'Bans', Icon: ShieldBan },
];

export const REPORT_TABS = [
  { id: 'open', label: 'Open' },
  { id: 'actioned', label: 'Actioned' },
  { id: 'dismissed', label: 'Dismissed' },
];
