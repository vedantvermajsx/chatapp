import { useState } from 'react';
import { Hash, AlignLeft, Sparkles } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const CreateRoomForm = ({
  newRoomName,
  setNewRoomName,
  newRoomDesc,
  setNewRoomDesc,
  createRoom
}) => {
  const { theme } = useTheme();
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const accent = theme.myMessageBubble || '#5865f2';
  const isLight = theme.isLight;

  const inputBase = {
    backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
    color: theme.otherMessageText,
    border: `1.5px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '10px',
    padding: '9px 12px 9px 36px',
    width: '100%',
    fontSize: '13.5px',
    outline: 'none',
    transition: 'border-color 0.18s, background-color 0.18s',
  };

  const inputFocused = {
    ...inputBase,
    borderColor: accent,
    backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
  };

  const iconColor = isLight ? '#8a8f98' : '#6d727c';
  const iconFocused = accent;

  return (
    <div className="flex flex-col gap-3 mt-3">
      {/* Room Name */}
      <div className="relative">
        <Hash
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-150"
          style={{ color: nameFocused ? iconFocused : iconColor }}
        />
        <input
          id="create-room-name"
          name="roomName"
          type="text"
          placeholder="Room name"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          style={nameFocused ? inputFocused : inputBase}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          required
        />
      </div>

      {/* Description */}
      <div className="relative">
        <AlignLeft
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none transition-colors duration-150"
          style={{ color: descFocused ? iconFocused : iconColor }}
        />
        <input
          id="create-room-desc"
          name="description"
          type="text"
          placeholder="Short description (optional)"
          value={newRoomDesc}
          onChange={(e) => setNewRoomDesc(e.target.value)}
          style={descFocused ? inputFocused : inputBase}
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={createRoom}
        disabled={!newRoomName.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-[10px] text-[13.5px] font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: accent,
          color: '#ffffff',
          border: 'none',
        }}
        onMouseEnter={(e) => {
          if (newRoomName.trim()) {
            e.currentTarget.style.filter = 'brightness(1.12)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = '';
          e.currentTarget.style.transform = '';
        }}
        onMouseDown={(e) => {
          if (newRoomName.trim()) {
            e.currentTarget.style.transform = 'translateY(0px)';
          }
        }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Create Room
      </button>
    </div>
  );
};

export default CreateRoomForm;
