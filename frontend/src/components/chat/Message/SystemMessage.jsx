import { useTheme } from "../../../contexts/ThemeContext";
import { useNeumorphism } from "../../../hooks/useNeumorphism";
import { UserPlus, UserMinus, Phone, PhoneMissed, MessageSquare, Edit3, XCircle } from "lucide-react";
import { formatSeenAt } from "../../../utils/dateUtils";

const SYSTEM_ICONS = {
    'member-joined': UserPlus,
    'member-left': UserMinus,
    'call': Phone,
    'missed-call': PhoneMissed,
    'room-created': MessageSquare,
    'room-renamed': Edit3,
    'room-deleted': XCircle,
};

const SystemMessage = ({ msg, isPrivateChat = false }) => {
    const { theme } = useTheme();
    const { getShadow } = useNeumorphism();

    const Icon = msg.systemType ? SYSTEM_ICONS[msg.systemType] : null;

    return (
        <div className="flex flex-col items-center my-6">
            <span
                className="text-xs px-6 py-3 rounded-2xl font-semibold flex items-center gap-2"
                style={{
                    border: `2px solid ${theme.otherMessageBubble}`,
                    color: theme.otherMessageText,
                    boxShadow: getShadow(theme.isLight, true, 0.5, 1)
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
