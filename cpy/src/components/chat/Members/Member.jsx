import { MessageSquare } from 'lucide-react';
import Admin from './Admin';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const getGenderLabel = (gender) => {
    const labels = ['Male', 'Female', 'Other'];
    return labels[gender] || 'Unknown';
};

function Member({
    admin,
    member,
    currentUserId,
    onStartPrivateChat,
    isOnline,
}) {
    const { theme } = useTheme();
    const { getShadow, getNeumorphicProps } = useNeumorphism();

    if (admin) return <Admin admin={member} currentUserId={currentUserId} onStartPrivateChat={onStartPrivateChat} isOnline={isOnline} />

    return (
        <div 
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ 
                backgroundColor: theme.background,
                boxShadow: getShadow(theme.isLight, false, 1, 3)
            }}
        >
            <Avatar url={member.avatar} name={member.username} gender={member.gender} size={10} isOnline={isOnline} />

            <div className="flex-1 min-w-0">
                <p
                    className="font-semibold truncate"
                    style={{ color: theme.otherMessageText }}
                >
                    {member.username}
                </p>

                <p
                    className="text-xs"
                    style={{ color: theme.otherUsernameColor, opacity: 0.8 }}
                >
                    {getGenderLabel(member.gender)}
                    {member.age ? ` • ${member.age} years old` : ''}
                </p>
            </div>

            {member.id !== currentUserId && (
                <button
                    onClick={() => onStartPrivateChat(member)}
                    className="p-2 rounded-full transition-all"
                    {...getNeumorphicProps(3, 6, 2, 4)}
                    title="Private Chat"
                >
                    <MessageSquare
                        className="w-5 h-5"
                        style={{ color: theme.otherUsernameColor }}
                    />
                </button>
            )}
        </div>
    );
}

export default Member;