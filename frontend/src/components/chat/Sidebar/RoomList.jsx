import { memo, useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import Spinner from '../../common/Spinner';
import Room from './Room';
import { useTheme } from '../../../contexts/ThemeContext';

const RoomList = memo(function RoomList({
  rooms,
  currentRoom,
  handleJoinRoom,
  loadingRooms,
  unreadCounts = {},
  label = 'Groups',
  emptyText = '',
}) {
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const headerColor = theme.isLight ? '#4e5058' : '#949ba4';

  return (
    <div className="mt-1 first:mt-0">
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-0.5 px-2 py-1 mt-0.5 group transition-colors"
        style={{ color: headerColor }}
        onMouseEnter={(e) => { e.currentTarget.style.color = theme.isLight ? '#060607' : '#f2f3f5'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = headerColor; }}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
          : <ChevronDown className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
        }
        <span className="text-[12px] font-bold uppercase tracking-wide leading-tight truncate">
          {label}
        </span>
        <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <Users className="w-3 h-3" strokeWidth={2} />
        </span>
      </button>
      {!collapsed && (
        <div className="mt-0.5">
          {loadingRooms ? (
            <div className="p-4 flex justify-center">
              <Spinner />
            </div>
          ) : rooms?.length === 0 ? (
            emptyText ? (
              <p
                className="text-[13px] px-3 py-1.5 leading-tight"
                style={{ color: theme.isLight ? '#7d8088' : '#6d727c' }}
              >
                {emptyText}
              </p>
            ) : null
          ) : (
            rooms?.map((room) => (
              <Room
                key={room._id}
                room={room}
                currentRoom={currentRoom}
                handleJoinRoom={handleJoinRoom}
                unread={unreadCounts[`room_${room._id}`] || 0}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

export default RoomList;