import { X, Loader2, Mic } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

export default function ChatMediaPreview({ selectedFile, isProcessingMedia, onRemoveFile, theme }) {
  const { getShadow } = useNeumorphism();

  if (!selectedFile && !isProcessingMedia) return null;

  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl p-3" style={{
      backgroundColor: theme.background,
      boxShadow: getShadow(theme.isLight, false, 1, 3)
    }}>
      {isProcessingMedia ? (
        <>
          <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.otherMessageBubble }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.otherMessageText }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: theme.otherMessageText }}>Processing media...</p>
            <p className="text-xs" style={{ color: theme.otherUsernameColor }}>Please wait</p>
          </div>
        </>
      ) : selectedFile ? (
        <>
          {selectedFile.type.startsWith('image/') ? (
            <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: theme.otherMessageBubble }}>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Selected image"
                className="w-full h-full object-cover"
              />
            </div>
          ) : selectedFile.type.startsWith('audio/') ? (
            <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.otherMessageBubble }}>
              <Mic className="w-8 h-8" style={{ color: theme.otherMessageText }} />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.otherMessageBubble }}>
              <svg className="w-8 h-8" style={{ color: theme.otherMessageText }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: theme.otherMessageText }}>{selectedFile.name}</p>
            <p className="text-xs" style={{ color: theme.otherUsernameColor }}>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button
            onClick={onRemoveFile}
            className="p-1 rounded-full transition"
            style={{ backgroundColor: theme.otherMessageBubble }}
          >
            <X className="w-5 h-5" style={{ color: theme.otherMessageText }} />
          </button>
        </>
      ) : null}
    </div>
  );
}
