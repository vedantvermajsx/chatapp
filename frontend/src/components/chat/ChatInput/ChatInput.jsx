import { Send, Paperclip, Sticker } from 'lucide-react';
import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, memo } from 'react';
import { toast } from 'sonner';
import Avatar from '../../common/Avatar';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';
import ChatMediaPreview from './ChatMediaPreview';
import ChatVoiceRecorder from './ChatVoiceRecorder';
import StickerPicker from './StickerPicker';
import MentionDropdown from './MentionDropdown';
import { SUPPORTED_FORMATS } from '../../../utils/constants.js';
import roomService from '../../../services/room.service.js';

const ChatInput = memo(forwardRef(({
  user,
  inputMessage,
  setInputMessage,
  sendMessage,
  disabled,
  onFileSelect,
  selectedFile,
  onRemoveFile,
  onStickerSend,
  socket,
  currentRoom,
  currentPrivateChat,
  roomMembers = []

}, ref) => {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mentionListRef = useRef(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mentionQuery, setMentionQuery] = useState(null); 
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [isMentionLoading, setIsMentionLoading] = useState(false);
  const { theme } = useTheme();
  const { getShadow } = useNeumorphism();
  const MAX_CHARS = 1000;
  const TYPING_STOP_DELAY = 2000;
  const TYPING_HEARTBEAT_INTERVAL = 3000;

  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);
  const typingTargetRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const mentionDebounceRef = useRef(null);
  const mentionAbortRef = useRef(null);



  const getMentionQuery = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return null;
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return null;
    const text = node.textContent.slice(0, range.startOffset);
    const match = text.match(/@(\S*)$/);
    return match ? match[1] : null;
  };

  const insertMention = (username) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent;
    const offset = range.startOffset;
    const before = text.slice(0, offset);
    const after = text.slice(offset);
    const replaced = before.replace(/@(\S*)$/, `@${username} `);
    node.textContent = replaced + after;
    const newOffset = replaced.length;
    const newRange = document.createRange();
    newRange.setStart(node, newOffset);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
    setInputMessage(inputRef.current?.innerText || '');
    setMentionQuery(null);
    setMentionSuggestions([]);
  };

  const fetchMentionSuggestions = useCallback((roomId, query) => {
    clearTimeout(mentionDebounceRef.current);
    if (mentionAbortRef.current) mentionAbortRef.current.abort();

    if (query === null) {
      setMentionSuggestions([]);
      setIsMentionLoading(false);
      return;
    }

    setIsMentionLoading(true);
    mentionDebounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      mentionAbortRef.current = controller;
      try {
        let results = await roomService.searchRoomMembers(roomId, query, 6, controller.signal);
        const currentUserId = user?._id || user?.id;
        if (currentUserId) {
          results = results.filter(m => m._id !== currentUserId && m.id !== currentUserId);
        }
        setMentionSuggestions(results);
        setMentionIndex(0);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setMentionSuggestions([]);
        }
      } finally {
        setIsMentionLoading(false);
      }
    }, 200);
  }, []);

  useEffect(() => {
    if (!currentRoom?._id) return;
    fetchMentionSuggestions(currentRoom._id, mentionQuery);
  }, [mentionQuery, currentRoom?._id, fetchMentionSuggestions]);

  useEffect(() => {
    setMentionQuery(null);
    setMentionSuggestions([]);
    clearTimeout(mentionDebounceRef.current);
    if (mentionAbortRef.current) mentionAbortRef.current.abort();
  }, [currentRoom?._id]);

  useEffect(() => {
    const handler = (e) => {
      if (
        mentionListRef.current &&
        !mentionListRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setMentionQuery(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isTyping = inputMessage.trim() !== '';
  const hasContent = isTyping || !!selectedFile;

  const getTypingPayload = (charCount) => {
    if (currentRoom) return { type: 'room', roomId: currentRoom._id };
    if (currentPrivateChat) return { type: 'private', receiverId: currentPrivateChat.id, charCount };
    return null;
  };

  const stopTyping = () => {
    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && socket && typingTargetRef.current) {
      socket.emit('stopTyping', typingTargetRef.current);
    }
    isTypingRef.current = false;
    lastTypingEmitRef.current = 0;
  };

  const handleTypingActivity = (charCount) => {
    if (!socket) return;
    const payload = getTypingPayload(charCount);
    if (!payload) return;

    typingTargetRef.current = payload;

    const now = Date.now();
    const needsHeartbeat = now - lastTypingEmitRef.current >= TYPING_HEARTBEAT_INTERVAL;

    if (!isTypingRef.current || needsHeartbeat) {
      isTypingRef.current = true;
      lastTypingEmitRef.current = now;
      socket.emit('typing', payload);
    } else if (currentPrivateChat) {
      socket.emit('typing', payload);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, TYPING_STOP_DELAY);
  };

  useEffect(() => {
    return () => stopTyping();
  }, [currentRoom?._id, currentPrivateChat?.id]);

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

  const stickerPickerRef = useRef(null);

  const handleToggleStickerPicker = () => {
    setShowStickerPicker(prev => !prev);
  };

  const handleStickerSelect = (sticker) => {
    setShowStickerPicker(false);
    if (onStickerSend) {
      onStickerSend(sticker);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        stickerPickerRef.current &&
        !stickerPickerRef.current.contains(event.target) &&
        !event.target.closest('button[title="Open sticker picker"]')
      ) {
        setShowStickerPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      {disabled && (
        <div className="absolute inset-0 z-20 cursor-not-allowed" style={{ backgroundColor: theme.background, opacity: 0.6 }} />
      )}
      <ChatMediaPreview
        selectedFile={selectedFile}
        isProcessingMedia={isProcessingMedia}
        onRemoveFile={onRemoveFile}
        theme={theme}
      />

      {showStickerPicker && (
        <StickerPicker
          pickerRef={stickerPickerRef}
          onStickerSelect={handleStickerSelect}
        />
      )}


      <MentionDropdown
        mentionQuery={mentionQuery}
        isMentionLoading={isMentionLoading}
        mentionSuggestions={mentionSuggestions}
        theme={theme}
        mentionIndex={mentionIndex}
        setMentionIndex={setMentionIndex}
        insertMention={insertMention}
        mentionListRef={mentionListRef}
      />

      <form onSubmit={(e) => { stopTyping(); sendMessage(e); }} className="flex items-center justify-center">
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
            style={{ boxShadow: 'none' }}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            title="Attach image/video"
          >
            <Paperclip className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
          </label>

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
                if (text.trim()) {
                  handleTypingActivity(text.length);
                } else {
                  stopTyping();
                }
                if (currentRoom) {
                  const q = getMentionQuery();
                  setMentionQuery(q);
                } else {
                  setMentionQuery(null);
                }
              }}
              onKeyDown={(e) => {
                if (mentionQuery !== null && mentionSuggestions.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionIndex(i => (i + 1) % mentionSuggestions.length);
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionIndex(i => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
                    return;
                  }
                  if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    insertMention(mentionSuggestions[mentionIndex].username);
                    return;
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setMentionQuery(null);
                    return;
                  }
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if ((inputMessage || selectedFile) && !disabled) {
                    stopTyping();
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


          {!isTyping && (
            <button
              type="button"
              onClick={handleToggleStickerPicker}
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              className="flex py-3 sm:py-4 items-center justify-center rounded-full transition-all flex-shrink-0"
              style={{ boxShadow: 'none' }}
              title="Open sticker picker"
            >
              <Sticker className="w-6 h-6" style={{ color: theme.otherUsernameColor }} />
            </button>
          )}


          {!isTyping && (
            <ChatVoiceRecorder
              theme={theme}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onAudioReady={(audioFile) => handleFileSelect({ target: { files: [audioFile] } })}
            />
          )}


          {hasContent && (
            <button
              type="submit"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              className="py-3 sm:py-4 flex items-center justify-center rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-12 h-12 hover:opacity-80"
              style={{ backgroundColor: theme.myMessageBubble }}
              disabled={disabled}
            >
              <Send className="w-6 h-6 mr-1 mt-1" style={{ color: theme.myMessageText }} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}));

export default ChatInput;