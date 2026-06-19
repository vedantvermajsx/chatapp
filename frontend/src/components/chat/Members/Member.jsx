import { MessageSquare } from 'lucide-react';
import Admin from './Admin';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';

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

    if (admin) return <Admin admin={member} currentUserId={currentUserId} onStartPrivateChat={onStartPrivateChat} isOnline={isOnline} />

    return (
        <div 
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ 
                backgroundColor: theme.background,
                boxShadow: theme.isLight ? '1px 1px 3px rgba(0,0,0,0.1), -1px -1px 3px rgba(255,255,255,0.8)' : '1px 1px 3px rgba(0,0,0,0.4), -1px -1px 3px rgba(255,255,255,0.05)'
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
                    style={{ 
                        backgroundColor: theme.background,
                        boxShadow: theme.isLight ? '3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.8)' : '3px 3px 6px rgba(0,0,0,0.4), -3px -3px 6px rgba(255,255,255,0.05)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = theme.isLight 
                            ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)' 
                            : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = theme.isLight 
                            ? '3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.8)' 
                            : '3px 3px 6px rgba(0,0,0,0.4), -3px -3px 6px rgba(255,255,255,0.05)';
                    }}
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