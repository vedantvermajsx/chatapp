import { useState } from 'react';
import Avatar from '../../common/Avatar';
import UserProfileModal from '../Modals/UserProfileModal';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const UserSearchRow = ({ user, onStartPrivateChat }) => {
  const { theme } = useTheme();
  const { getNeumorphicProps } = useNeumorphism();
  const accent = theme.primary || '#6366f1';
  const [showProfile, setShowProfile] = useState(false);

  const handleStartChat = (e) => {
    e.stopPropagation();
    onStartPrivateChat({ ...user, id: user.id });
  };

  return (
    <>
      <div
        className="p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 md:gap-4"
        onClick={() => setShowProfile(true)}
        {...getNeumorphicProps(1, 2, 2, 1, false, true)}
      >
        <Avatar url={user.avatar} name={user.username} size={10} mdSize={10} />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs md:text-sm truncate" style={{ color: theme.otherMessageText }}>
            {user.username}
          </h3>
          {!!user.bio && (
            <p className="text-xs truncate mt-1 font-medium opacity-70" style={{ color: theme.otherMessageText }}>
              {user.bio}
            </p>
          )}
        </div>
        <button
          onClick={handleStartChat}
          className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          Chat
        </button>
      </div>

      {showProfile && (
        <UserProfileModal
          userId={user.id}
          fallback={{ username: user.username, avatar: user.avatar }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
};

export default UserSearchRow;
