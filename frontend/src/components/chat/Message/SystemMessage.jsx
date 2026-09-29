import { useTheme } from "../../../contexts/ThemeContext";
import { useNeumorphism } from "../../../hooks/useNeumorphism";
import { UserPlus, UserMinus, Phone, PhoneMissed, MessageSquare, Edit3, Trash2 } from "lucide-react";
import { formatSeenAt } from "../../../utils/dateUtils";

const SYSTEM_ICONS = {
    'member-joined': UserPlus,
    'member-left': UserMinus,
    'call': Phone,
    'missed-call': PhoneMissed,
    'room-created': MessageSquare,
    'room-renamed': Edit3,
    'room-deleted': Trash2,
};

const SystemMessage = ({ msg, isPrivateChat = false }) => {
    const { theme } = useTheme();
    const { getShadow } = useNeumorphism();

    const Icon = msg.systemType ? SYSTEM_ICONS[msg.systemType] : null;

    return (
        <div className="flex flex-col items-center my-4">
            <span
                className="text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-2 transition-colors"
                style={{
                    backgroundColor: theme.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                    color: theme.isLight ? '#4e5058' : '#949ba4',
                }}
            >
                {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                {msg?.text}
            </span>

            {msg.isOwn && !msg.isPending && isPrivateChat && msg.isSeen && (
                <p className="text-[10px] mt-1" style={{ color: theme.isLight ? '#4b5563' : '#9ca3af', opacity: 0.9 }}>
                    {formatSeenAt(msg.seenAt)}
                </p>
            )}
        </div>
    );
};

export default SystemMessage;
