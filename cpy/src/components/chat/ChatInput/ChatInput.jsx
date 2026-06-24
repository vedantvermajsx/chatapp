import { Send, Paperclip, Smile } from 'lucide-react';
import { useRef, useState, useEffect, forwardRef, useImperativeHandle, memo } from 'react';
import { toast } from 'sonner';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';
import ChatMediaPreview from './ChatMediaPreview';
import ChatVoiceRecorder from './ChatVoiceRecorder';
import { SUPPORTED_FORMATS} from '../../../utils/constants.js';

const ChatInput = memo(forwardRef(({
  user,
  inputMessage,
  setInputMessage,
  sendMessage,
  disabled,
  onFileSelect,
  selectedFile,
  onRemoveFile,
  onEmojiPickerToggle

}, ref) => {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const { theme } = useTheme();
  const { getShadow } = useNeumorphism();
  const MAX_CHARS = 1000;

  useEffect(() => {
    let interval;
    if (isRecording) {
      if (inputRef.current) inputRef.current.blur();
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }));

  const MAX_SIZE = 8 * 1024 * 1024;

  const getFormatCategory = (mimeType) => {
    for (const [category, types] of Object.entries(SUPPORTED_FORMATS)) {
      if (types.includes(mimeType)) return category;
    }
    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const category = getFormatCategory(file.type);
    if (!category) {
      toast.error(`Format "${file.type}" is not supported!`);
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('File size must be less than 8MB!');
      return;
    }

    if (onFileSelect) {
      onFileSelect(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let handled = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('video') !== -1) {
        const file = items[i].getAsFile();

        handleFileSelect({ target: { files: [file] } });
        e.preventDefault();
        handled = true;
        break;
      }
    }

    if (!handled && e.clipboardData) {
      const html = e.clipboardData.getData('text/html');
      if (html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const img = doc.querySelector('img');
        if (img && img.src && !img.src.startsWith('file://')) {
          e.preventDefault();
          handled = true;
          setIsProcessingMedia(true);
          fetch(img.src)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], 'gif-image.gif', { type: blob.type });
              handleFileSelect({ target: { files: [file] } });
            })
            .catch(err => {
              console.error("Failed to parse GIF URL blob:", err);
              toast.error("Failed to fetch GIF from clipboard.");
            })
            .finally(() => setIsProcessingMedia(false));
        }
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer?.files?.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          handleFileSelect({ target: { files: [file] } });
          return;
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const emojiPickerRef = useRef(null);

  const handleToggleEmojiPicker = () => {
    const newState = !showEmojiPicker;
    setShowEmojiPicker(newState);
    if (onEmojiPickerToggle) {
      onEmojiPickerToggle(newState);
    }
  };

  const handleEmojiSelect = (emoji) => {
    if (inputRef.current) {
      const current = inputRef.current.innerText;
      const combined = current + emoji.native;
      const trimmed = combined.slice(0, MAX_CHARS);
      inputRef.current.innerText = trimmed;
      setInputMessage(trimmed);
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(inputRef.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        !event.target.closest('button[title="Open emoji picker"]')
      ) {
        setShowEmojiPicker(false);
        if (onEmojiPickerToggle) {
          onEmojiPickerToggle(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onEmojiPickerToggle]);

  useEffect(() => {
    if (inputRef.current) {
      if (inputMessage === '') {
        if (inputRef.current.innerHTML !== '<br>' && inputRef.current.innerHTML !== '') {
          inputRef.current.innerHTML = '<br>';
        }
      } else if (
        inputRef.current.innerText !== inputMessage &&
        inputRef.current.textContent !== inputMessage
      ) {
        inputRef.current.innerText = inputMessage;

        try {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(inputRef.current);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (err) {
          console.error(err);
        }
      }
    }
  }, [inputMessage]);

  return (
    <div className="p-2 sm:p-6 border-t relative" style={{ backgroundColor: theme.background, borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
      <ChatMediaPreview
        selectedFile={selectedFile}
        isProcessingMedia={isProcessingMedia}
        onRemoveFile={onRemoveFile}
        theme={theme}
      />

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="absolute bottom-full left-4 mb-2 z-50">
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme={theme.isLight ? 'light' : 'dark'}
          />
        </div>
      )}

      <form onSubmit={sendMessage} className="flex items-center justify-center">
        {user && (
          <div className="mr-3 flex-shrink-0 hidden sm:block">
            <Avatar url={user.avatar} name={user.username} gender={user.gender} size={12} />
          </div>
        )}
        <div className="w-full sm:w-4/5 lg:w-3/4 flex items-center gap-2 sm:gap-3 rounded-2xl px-4 sm:px-6 py-2 sm:py-1 relative" style={{
          backgroundColor: theme.background,
          boxShadow: getShadow(theme.isLight, false, 2, 5)
        }}>
          <input
            ref={fileInputRef}
            id="file-upload"
            name="file"
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          <label
            htmlFor="file-upload"
            className="py-3 sm:py-4 flex items-center justify-center rounded-full transition-all flex-shrink-0 cursor-pointer"
            style={{
              boxShadow: 'none'
            }}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}

            title="Attach image/video"
          >
            <Paperclip className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
          </label>

          <button
            type="button"
            onClick={handleToggleEmojiPicker}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            className="hidden sm:flex py-3 sm:py-4 items-center justify-center rounded-full transition-all flex-shrink-0"
            style={{
              boxShadow: 'none'
            }}
            title="Open emoji picker"
          >
            <Smile className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
          </button>

          <ChatVoiceRecorder
            theme={theme}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            onAudioReady={(audioFile) => handleFileSelect({ target: { files: [audioFile] } })}
          />

          <div className="flex-1 relative min-w-0">
            {isRecording && (
              <div className="absolute inset-0 flex items-center gap-3 px-4 rounded-2xl z-10" style={{ backgroundColor: theme.background }}>
                <div className="flex-shrink-0 flex items-center justify-center">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
                <span className="font-mono text-sm sm:text-base tabular-nums font-semibold" style={{ color: theme.otherMessageText }}>
                  {formatTime(recordingTime)}
                </span>
                <span className="text-sm ml-2 animate-pulse" style={{ color: theme.otherUsernameColor }}>
                  Recording...
                </span>
              </div>
            )}
            <div
              ref={inputRef}
              id="chat-message"
              contentEditable={!disabled && !isRecording}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onInput={(e) => {
                const text = e.currentTarget.innerText;
                if (text.length > MAX_CHARS) {
                  e.currentTarget.innerText = text.slice(0, MAX_CHARS);
                  const range = document.createRange();
                  const sel = window.getSelection();
                  range.selectNodeContents(e.currentTarget);
                  range.collapse(false);
                  sel.removeAllRanges();
                  sel.addRange(range);
                  setInputMessage(e.currentTarget.innerText);
                } else {
                  setInputMessage(text);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if ((inputMessage || selectedFile) && !disabled) {
                    sendMessage(e);
                  }
                }
              }}
              className="py-3 sm:py-4 rounded-2xl border-none focus:outline-none min-w-0 text-base sm:text-lg px-4 overflow-y-auto whitespace-pre-wrap outline-none break-words overflow-x-hidden"
              style={{
                opacity: isRecording ? 0 : 1,
                pointerEvents: isRecording ? 'none' : 'auto',
                backgroundColor: theme.background,
                color: theme.otherMessageText,
                minHeight: '3rem',
                maxHeight: 'calc(1.5rem * 3 + 1.5rem)',
                lineHeight: '1.5rem'
              }}
              role="textbox"
              aria-multiline="true"
            />
            {!isRecording && inputMessage === '' && (
              <span style={{
                color: theme.otherUsernameColor,
                opacity: 0.6,
                position: 'absolute',
                top: '50%',
                left: '1rem',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                Type your message...
              </span>
            )}
            {!isRecording && inputMessage.length >= MAX_CHARS - 100 && (
              <span style={{
                position: 'absolute',
                bottom: '0.15rem',
                right: '0.5rem',
                fontSize: '0.7rem',
                pointerEvents: 'none',
                color: inputMessage.length >= MAX_CHARS ? '#ef4444' : theme.otherUsernameColor,
                opacity: 0.8,
                fontWeight: inputMessage.length >= MAX_CHARS ? '600' : '400',
              }}>
                {inputMessage.length}/{MAX_CHARS}
              </span>
            )}
          </div>

          <button
            type="submit"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            className="py-3 sm:py-4 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-12 h-12 hover:opacity-80"
            style={{ backgroundColor: theme.myMessageBubble }}
            disabled={disabled || (!inputMessage && !selectedFile)}
          >
            <Send className="w-6 h-6 mr-1 mt-1" style={{ color: theme.myMessageText }} />
          </button>
        </div>
      </form>
    </div>
  );
}));

export default ChatInput;
