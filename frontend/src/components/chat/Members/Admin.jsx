import { MessageSquare } from 'lucide-react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import Member from './Member';

const getGenderLabel = (gender) => {
    const labels = ['Male', 'Female', 'Other'];
    return labels[gender] || 'Unknown';
};

function Admin({
    admin,
    currentUserId,
    onStartPrivateChat,
    isOnline
}) {
    const { theme } = useTheme();

    return (
        <div key={admin._id}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{
                backgroundColor: theme.isLight ? 'rgba(0, 128, 128, 0.15)' : 'rgba(96, 165, 250, 0.15)',
                boxShadow: theme.isLight ? '0px 0px 1px rgba(0,0,0,0.2), 0px 0px 0px rgba(0,128,128,0.3)' : '0px 0px 1px rgba(0,0,0,0.5), 0px 0px 0px rgba(96, 165, 250,0.3)'
            }}
        >
            <Avatar url={admin.avatar} name={admin.username} gender={admin.gender} size={10} isOnline={isOnline} />

            <div className="flex-1 min-w-0">
                <p
                    className="font-semibold truncate"
                    style={{ color: theme.otherMessageText }}
                >
                    {admin.username}
                </p>

                <p
                    className="text-xs"
                    style={{ color: theme.otherUsernameColor, opacity: 0.8 }}
                >
                    {getGenderLabel(admin.gender)}
                    {admin.age ? ` • ${admin.age} years old` : ''}
                </p>
            </div>

            {admin.id !== currentUserId && (
                <button
                    onClick={() => onStartPrivateChat({ ...admin, id: admin.id || admin._id })}
                    className="p-2 rounded-full transition-all"
                    style={{
                        backgroundColor: theme.isLight ? 'rgba(0, 128, 128, 0.15)' : 'rgba(96, 165, 250, 0.15)'
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

export default Admin;