import { useTheme } from '../../../contexts/ThemeContext';

const CreateRoomForm = ({
  newRoomName,
  setNewRoomName,
  newRoomDesc,
  setNewRoomDesc,
  createRoom
}) => {
  const { theme } = useTheme();
  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  return (
    <div className="mt-5 flex flex-col gap-4">
      <input
        id="create-room-name"
        name="roomName"
        type="text"
        placeholder="Room name"
        value={newRoomName}
        onChange={(e) => setNewRoomName(e.target.value)}
        className="w-full py-4 px-6 border-none rounded-2xl transition-all"
        style={{
          backgroundColor: theme.background,
          color: theme.otherMessageText,
          boxShadow: isLight
            ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
            : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)',
          '::placeholder': { color: theme.otherUsernameColor, opacity: 0.7 }
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = isLight
            ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
            : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = isLight
            ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
            : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)';
        }}
        required
      />
      <input
        id="create-room-desc"
        name="description"
        type="text"
        placeholder="Description"
        value={newRoomDesc}
        onChange={(e) => setNewRoomDesc(e.target.value)}
        className="w-full py-4 px-6 border-none rounded-2xl transition-all"
        style={{
          backgroundColor: theme.background,
          color: theme.otherMessageText,
          boxShadow: isLight
            ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
            : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)'
        }}
        onFocus={(e) => {
          e.target.style.boxShadow = isLight
            ? 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.8)'
            : 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.05)';
        }}
        onBlur={(e) => {
          e.target.style.boxShadow = isLight
            ? 'inset 1px 1px 3px rgba(0,0,0,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)'
            : 'inset 1px 1px 3px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.05)';
        }}
        required
      />
      <button
        type="button"
        onClick={createRoom}
        className="w-full py-4 font-bold rounded-2xl transition-all"
        style={{
          backgroundColor: theme.background,
          color: theme.otherMessageText,
          boxShadow: isLight
            ? '2px 2px 3px rgba(0,0,0,0.1), -2px -2px 3px rgba(255,255,255,0.8)'
            : '2px 2px 3px rgba(0,0,0,0.4), -2px -2px 3px rgba(255,255,255,0.05)'
        }}
        onMouseEnter={(e) => {
          e.target.style.boxShadow = isLight
            ? 'inset 1px 1px 2px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.8)'
            : 'inset 1px 1px 2px rgba(0,0,0,0.4), inset -1px -1px 2px rgba(255,255,255,0.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.boxShadow = isLight
            ? '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.8)'
            : '2px 2px 4px rgba(0,0,0,0.4), -2px -2px 4px rgba(255,255,255,0.05)';
        }}
      >
        Create Room
      </button>
    </div>
  );
};

export default CreateRoomForm;
