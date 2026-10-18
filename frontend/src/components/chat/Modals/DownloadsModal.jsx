import { useState } from 'react';
import { X, HardDriveDownload, FileImage, FileVideoCamera, FileText, Trash2, Download, Eye, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDownloads, formatBytes } from '../../../contexts/DownloadsContext';

const relativeTime = (ts) => {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
};

const typeIcon = (mediaType) => {
  if (mediaType === 'video') return FileVideoCamera;
  if (mediaType === 'image') return FileImage;
  return FileText;
};

const DownloadsModal = ({ onClose }) => {
  const { theme } = useTheme();
  const {
    downloads,
    activeCount,
    removeDownload,
    clearDownloads,
    ensureBlobUrl,
  } = useDownloads();
  const [busyId, setBusyId] = useState(null);

  const isLight = theme.background === '#e6e6e6' || theme.background === '#e0f7fa' || theme.background === '#fff3e0' || theme.background === '#e8f5e9' || theme.background === '#f3e5f5' || theme.background === '#fce4ec';
  const border = isLight ? '#e2e8f0' : '#2d3748';
  const cardBg = isLight ? '#f8fafc' : '#0c2125';
  const hoverBg = isLight ? '#eef2f7' : '#12303a';
  const accent = theme.primary || '#6366f1';
  const subText = theme.otherUsernameColor;
  const titleColor = theme.otherMessageText;

  const handleView = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const url = await ensureBlobUrl(item);
      if (!url) return;
      onClose?.();
      window.dispatchEvent(
        new CustomEvent('openImageZoom', {
          detail: { url, media: null, type: item.mediaType === 'video' ? 'video' : 'image' },
        })
      );
    } finally {
      setBusyId(null);
    }
  };

  const IconBtn = ({ onClick, title, disabled, danger, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="dl-btn p-2 rounded-lg transition-colors disabled:opacity-50"
      style={{ color: subText, '--dl-hover': danger ? '#ef444422' : hoverBg, '--dl-hover-color': danger ? '#ef4444' : titleColor }}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center w-full p-4">
      <style>{`.dl-btn:hover:not(:disabled){background:var(--dl-hover);color:var(--dl-hover-color)!important}.dl-row:hover{background:var(--dl-row)}`}</style>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="glass-strong pop-in relative rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: border }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}1f` }}>
              <HardDriveDownload className="w-[18px] h-[18px]" style={{ color: accent }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold leading-tight" style={{ color: titleColor }}>Downloads</h2>
              <p className="text-[11px] leading-tight mt-0.5" style={{ color: subText }}>
                {activeCount > 0 ? `${activeCount} in progress` : `${downloads.length} ${downloads.length === 1 ? 'file' : 'files'}`}
              </p>
            </div>
          </div>
          <IconBtn onClick={onClose} title="Close">
            <X className="w-5 h-5" />
          </IconBtn>
        </div>

        {/* Location bar */}
        <div className="px-5 py-3 border-b" style={{ borderColor: border }}>
          <p className="text-[11px]" style={{ color: subText }}>
            Saved to your browser's Downloads folder
          </p>
        </div>

        {/* List */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {downloads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1" style={{ backgroundColor: `${accent}1a` }}>
                <Download className="w-6 h-6" style={{ color: accent }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: titleColor }}>No downloads yet</p>
              <p className="text-xs max-w-[15rem]" style={{ color: subText }}>
                Images, videos and files you download from chats will show up here.
              </p>
            </div>
          ) : (
            <ul className="p-2 flex flex-col gap-1">
              {downloads.map((item) => {
                const Icon = typeIcon(item.mediaType);
                const isActive = item.status === 'downloading';
                const isFailed = item.status === 'failed';
                const isCompleted = item.status === 'completed';
                const isMedia = item.mediaType === 'image' || item.mediaType === 'video';
                const isBusy = busyId === item.id;
                const meta = [formatBytes(item.size), relativeTime(item.completedAt || item.createdAt)].filter(Boolean).join(' · ');

                return (
                  <li
                    key={item.id}
                    className="dl-row flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{ '--dl-row': cardBg }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isFailed ? '#ef444420' : `${accent}1f` }}
                    >
                      {isFailed ? (
                        <AlertCircle className="w-5 h-5" style={{ color: '#ef4444' }} />
                      ) : (
                        <Icon className="w-5 h-5" style={{ color: accent }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: titleColor }} title={item.filename}>
                        {item.filename}
                      </p>
                      {isActive ? (
                        <>
                          <div className="mt-1.5 h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: isLight ? '#e2e8f0' : '#1f2937' }}>
                            <div
                              className={item.progress > 0 ? 'h-full rounded-full transition-[width] duration-300' : 'h-full w-1/3 rounded-full animate-pulse'}
                              style={{ width: item.progress > 0 ? `${item.progress}%` : undefined, backgroundColor: accent }}
                            />
                          </div>
                          <p className="text-[11px] mt-1 tabular-nums" style={{ color: subText }}>
                            {item.progress > 0 ? `${item.progress}%` : 'Starting…'}
                            {item.size ? ` · ${formatBytes(item.size)}` : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] mt-0.5 truncate flex items-center gap-1" style={{ color: isFailed ? '#ef4444' : subText }}>
                          {isCompleted && <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: '#22c55e' }} />}
                          <span className="truncate">{isFailed ? `Failed${item.error ? ` · ${item.error}` : ''}` : meta}</span>
                        </p>
                      )}
                    </div>

                    {!isActive && (
                      <div className="flex items-center flex-shrink-0">
                        {isCompleted && isMedia && (
                          <IconBtn onClick={() => handleView(item)} disabled={isBusy} title="View">
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                          </IconBtn>
                        )}
                        <IconBtn onClick={() => removeDownload(item.id)} title="Remove" danger>
                          <Trash2 className="w-4 h-4" />
                        </IconBtn>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {downloads.length > 0 && (
          <div className="px-5 py-3 border-t flex justify-end" style={{ borderColor: border }}>
            <button
              onClick={clearDownloads}
              className="dl-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ color: subText, '--dl-hover': '#ef444422', '--dl-hover-color': '#ef4444' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear list
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsModal;
