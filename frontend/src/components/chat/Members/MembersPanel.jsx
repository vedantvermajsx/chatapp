import { X, Users, Search, Loader2 } from 'lucide-react';
import Member from './Member';
import MemberSkeleton from './MemberSkeleton';
import { useTheme } from '../../../contexts/ThemeContext';
import { memo, useState, useEffect, useRef, useCallback } from 'react';

const MembersPanel = memo(function MembersPanel({
  show, onClose, members, admin, onStartPrivateChat, currentUserId, loading,
  hasMoreMembers, loadMoreRoomMembers, loadRoomMembers
}) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  const scrollRef = useRef(null);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        loadRoomMembers(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, show, loadRoomMembers]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasMoreMembers || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMoreRoomMembers(searchQuery);
    }
  }, [hasMoreMembers, loading, loadMoreRoomMembers, searchQuery]);

  if (!show) return null;

  const filteredMembers = members ? members.filter(m => m.username.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  const onlineMembers = filteredMembers.filter(m => m.isOnline).sort((a, b) => a.username.localeCompare(b.username));
  const offlineMembers = filteredMembers.filter(m => !m.isOnline).sort((a, b) => a.username.localeCompare(b.username));

  return (
    <div id={admin + 'panel'} className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div
        className="absolute right-0 top-0 h-full w-4/5 sm:w-72 md:w-80 overflow-hidden flex flex-col"
        style={{
          backgroundColor: theme.background,
          borderLeft: `1px solid ${isLight ? '#cbd5e0' : '#4a5568'}`
        }}
      >
        <div
          className="p-4 border-b flex flex-col gap-4"
          style={{ borderColor: isLight ? '#cbd5e0' : '#4a5568' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
              <h2 className="text-xl font-bold" style={{ color: theme.otherMessageText }}>Room Members</h2>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-full transition-all"
              style={{
                backgroundColor: theme.background,
                boxShadow: isLight ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)' : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = isLight
                  ? 'inset 3px 3px 6px rgba(0,0,0,0.1), inset -3px -3px 6px rgba(255,255,255,0.8)'
                  : 'inset 3px 3px 6px rgba(0,0,0,0.4), inset -3px -3px 6px rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = isLight
                  ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)'
                  : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)';
              }}
            >
              <X className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
            </button>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              backgroundColor: theme.background,
              boxShadow: isLight ? 'inset 2px 2px 5px rgba(0,0,0,0.05), inset -2px -2px 5px rgba(255,255,255,0.5)' : 'inset 2px 2px 5px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.02)'
            }}
          >
            <Search className="w-4 h-4" style={{ color: theme.otherUsernameColor }} />
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none text-sm"
              style={{ color: theme.otherMessageText }}
            />
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto custom-scrollbar p-5"
          style={{ backgroundColor: theme.background }}
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {loading && (!members || members.length === 0) ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <MemberSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {onlineMembers.length > 0 && (
                <div key={admin + 'panel' + 'online'} className="mb-5">
                  <h3 className="text-sm font-bold mb-4 px-2" style={{ color: theme.otherUsernameColor }}>Online</h3>
                  <div className="space-y-3">
                    {onlineMembers.map((member) => (
                      <Member
                        admin={admin == member._id}
                        key={member._id}
                        member={member}
                        currentUserId={currentUserId}
                        onStartPrivateChat={onStartPrivateChat}
                        isOnline={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {offlineMembers.length > 0 && (
                <div key={admin + 'panel' + 'offline'}>
                  <div className="border-t my-4 mx-2" style={{ borderColor: isLight ? '#cbd5e0' : '#4a5568' }} />
                  <h3 className="text-sm font-bold mb-4 px-2" style={{ color: theme.otherUsernameColor }}>Offline</h3>
                  <div className="space-y-3">
                    {offlineMembers.map((member) => (
                      <Member
                        admin={admin == member._id}
                        key={member._id}
                        member={member}
                        currentUserId={currentUserId}
                        onStartPrivateChat={onStartPrivateChat}
                        isOnline={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {loading && members && members.length > 0 && (
            <div className="flex justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: theme.otherUsernameColor }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default MembersPanel;
