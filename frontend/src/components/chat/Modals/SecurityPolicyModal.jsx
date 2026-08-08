import { X, ShieldCheck, FileText, Code2, Lock, Smartphone, ExternalLink } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const LINKS = [
  { key: 'privacy', label: 'Privacy Policy', icon: ShieldCheck, url: 'https://example.com/privacy' },
  { key: 'terms', label: 'Terms of Service', icon: FileText, url: 'https://example.com/terms' },
  { key: 'licenses', label: 'Open Source Licenses', icon: Code2, url: 'https://example.com/licenses' },
];

const SecurityPolicyModal = ({ onClose }) => {
  const { theme } = useTheme();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  const border = isLight ? '#cbd5e0' : '#4a5568';
  const cardBg = isLight ? '#f8fafc' : '#091b1e';
  const accent = theme.primary || '#6366f1';
  const subText = theme.otherUsernameColor;

  const Row = ({ icon: Icon, label, _, onClick, external }) => (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3.5 ${onClick ? 'cursor-pointer' : ''}`}
      style={{ borderBottom: `1px solid ${border}` }}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}22` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: theme.otherMessageText }}>{label}</p>
      </div>
      {external && <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: subText }} />}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center w-full ">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
        style={{ backgroundColor: theme.background }}
      >
        <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: border }}>
          <h2 className="text-base font-bold" style={{ color: theme.otherMessageText }}>Security &amp; Policy</h2>
          <button onClick={onClose} className="p-1.5 rounded-full transition-all">
            <X className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
          <div>
            <p className="text-xs font-bold mb-2 px-1" style={{ color: subText }}>ACCOUNT SECURITY</p>
            <div className="rounded-2xl overflow-hidden border" style={{ backgroundColor: cardBg, borderColor: border }}>
              <Row icon={Lock} label="Session token" sub="Your login is protected with a secure token stored only in this browser." />
              <div style={{ borderBottom: 'none' }}>
                <Row icon={Smartphone} label="Signed in on this browser" sub="Use Logout in Settings if this isn't your device or you want to end this session." />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold mb-2 px-1" style={{ color: subText }}>LEGAL</p>
            <div className="rounded-2xl overflow-hidden border" style={{ backgroundColor: cardBg, borderColor: border }}>
              {LINKS.map((item) => (
                <a key={item.key} href={item.url} target="_blank" rel="noopener noreferrer" className="block">
                  <Row icon={item.icon} label={item.label} external />
                </a>
              ))}
            </div>
          </div>

          <div className="px-1">
            <p className="text-sm font-bold mb-1.5" style={{ color: theme.otherMessageText }}>How we handle your data</p>
            <p className="text-xs leading-relaxed" style={{ color: subText }}>
              Messages and media are stored to keep your chats in sync across sessions. Cached data lives
              in this browser and is managed automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPolicyModal;
