import { useTheme } from "../../../contexts/ThemeContext";
import { useNeumorphism } from "../../../hooks/useNeumorphism";
import { UserPlus, UserMinus, Phone, PhoneMissed, MessageSquare, Edit3 } from "lucide-react";

const SYSTEM_ICONS = {
  'member-joined': UserPlus,
  'member-left': UserMinus,
  'call': Phone,
  'missed-call': PhoneMissed,
  'room-created': MessageSquare,
  'room-renamed': Edit3,
};

const SystemMessage = ({ msg }) => {
    const { theme } = useTheme();
    const { getShadow } = useNeumorphism();

    const Icon = msg.systemType ? SYSTEM_ICONS[msg.systemType] : null;

    return (
        <div className="flex justify-center my-6">
            <span
                className="text-xs px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 border"
                style={{
                    backgroundColor: theme.background,
                    borderColor: theme.isLight ? '#e2e8f0' : '#4a5568',
                    color: theme.otherMessageText,
                    boxShadow: getShadow(theme.isLight, false, 2, 5)
                }}
            >
                {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                {msg?.text}
            </span>
        </div>
    );
};

export default SystemMessage;
