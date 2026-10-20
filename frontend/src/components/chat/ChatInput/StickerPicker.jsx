import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import LoaderMini from '../../common/Loader';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';
import apiClient from '../../../services/api';
import { dbService } from '../../../services/indexedDB.service.js';


const getMediaUrl = (file) => {
  if (!file) return null;
  return file.xs?.webp?.url || file.xs?.gif?.url || null;
};

const MAX_RECENT = 100;

const TABS = [
  { id: 'recent', label: 'Recent' },
  { id: 'stickers', label: 'Stickers' },
  { id: 'gifs', label: 'GIFs' },
];

const StickerPicker = memo(({ onStickerSelect, pickerRef, onClose }) => {
  const { theme } = useTheme();
  const { getShadow } = useNeumorphism();

  // null until the saved Recent list has been read: opens on Recent when there is any, else Stickers
  const [activeTab, setActiveTab] = useState(null);
  const [recents, setRecents] = useState([]);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [mode, setMode] = useState('trending');

  const searchTimeoutRef = useRef(null);
  const currentQueryRef = useRef('');
  const objectUrlsRef = useRef([]);

  const isRecent = activeTab === 'recent';
  const base = activeTab === 'gifs' ? 'gifs' : 'stickers';

  const revokeObjectUrls = () => {
    objectUrlsRef.current.forEach((u) => { try { URL.revokeObjectURL(u); } catch { /* ignore */ } });
    objectUrlsRef.current = [];
  };

  // Reads the saved recents from the local DB. Items with saved image bytes render from disk (works offline).
  const loadRecents = useCallback(async () => {
    const rows = await dbService.getRecentStickers();
    revokeObjectUrls();
    const list = rows.map((r) => {
      let src = r.url;
      if (r.blob) {
        try {
          src = URL.createObjectURL(r.blob);
          objectUrlsRef.current.push(src);
        } catch { /* fall back to remote url */ }
      }
      return { key: r.key, type: r.type, url: r.url, title: r.title, src, hasBlob: !!r.blob };
    });
    setRecents(list);

    // while online, quietly save image bytes for older recents that don't have them yet
    if (typeof navigator === 'undefined' || navigator.onLine !== false) {
      list.filter((r) => !r.hasBlob).slice(0, 10).forEach((r) => {
        dbService.cacheRecentStickerBlob(r.type, r.url).catch(() => {});
      });
    }
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let list = [];
      try { list = await loadRecents(); } catch { /* ignore */ }
      if (!cancelled) setActiveTab(list.length ? 'recent' : 'stickers');
    })();
    return () => {
      cancelled = true;
      revokeObjectUrls();
    };
  }, [loadRecents]);

  const fetchItems = useCallback(async (q, pg, reset, tabBase) => {
    if (loading) return;
    setLoading(true);
    setFetchFailed(false);
    try {
      const endpoint = q ? 'search' : 'trending';
      const res = await apiClient.get(`/media/${tabBase}/${endpoint}`, {
        params: q
          ? { q, page: pg, per_page: 12 }
          : { page: pg, per_page: 12 },
      });
      const json = res.data;

      const list = json?.data?.data || [];
      const next = json?.data?.has_next ?? false;

      setItems(prev => reset ? list : [...prev, ...list]);
      setHasNext(next);
      setPage(pg);
    } catch (e) {
      console.error('Sticker fetch error:', e);
      setFetchFailed(true);
    } finally {
      setLoading(false);
    }
  }, [loading]);


  useEffect(() => {
    if (!activeTab) return;
    setItems([]);
    setPage(1);
    setHasNext(true);
    setSearchQuery('');
    setMode('trending');
    setFetchFailed(false);
    currentQueryRef.current = '';
    if (activeTab === 'recent') {
      loadRecents().catch(() => {});
      return;
    }
    fetchItems('', 1, true, activeTab);

  }, [activeTab]);

  const handleSearch = (q) => {
    setSearchQuery(q);
    clearTimeout(searchTimeoutRef.current);

    if (!q.trim()) {
      currentQueryRef.current = '';
      setMode('trending');
      setItems([]);
      setPage(1);
      setHasNext(true);
      fetchItems('', 1, true, base);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      currentQueryRef.current = q;
      setMode('search');
      setItems([]);
      setPage(1);
      fetchItems(q, 1, true, base);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    currentQueryRef.current = '';
    setMode('trending');
    setItems([]);
    setPage(1);
    fetchItems('', 1, true, base);
  };

  const handleScroll = (e) => {
    if (isRecent) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && hasNext && !loading) {
      fetchItems(currentQueryRef.current, page + 1, false, base);
    }
  };

  // Save to Recent (moves it to the top) and, best-effort, keep the image for offline use.
  const remember = (type, url, title) => {
    dbService.addRecentSticker({ type, url, title })
      .then(() => dbService.cacheRecentStickerBlob(type, url))
      .catch(() => {});
  };

  const handleSelect = (item) => {
    const url = getMediaUrl(item.file);
    if (!url) return;
    const type = activeTab === 'stickers' ? 'sticker' : 'gif';
    onStickerSelect({ type, url });
    remember(type, url, item.title);
  };

  const handleSelectRecent = (r) => {
    onStickerSelect({ type: r.type, url: r.url });
    remember(r.type, r.url, r.title);
  };

  const handleClearRecent = async () => {
    try {
      await dbService.clearRecentStickers();
      await loadRecents();
    } catch (e) {
      console.error('Clear recent error:', e);
    }
  };

  const displayItems = isRecent
    ? recents.map((r) => ({ id: r.key, src: r.src, alt: r.title || r.type, onPick: () => handleSelectRecent(r) }))
    : items
        .map((item, i) => {
          const url = getMediaUrl(item.file);
          if (!url) return null;
          return { id: item.id || item._id || `${i}`, src: url, alt: item.title || activeTab, onPick: () => handleSelect(item) };
        })
        .filter(Boolean);

  const border = theme.isLight ? '#e2e8f0' : '#374151';
  const inputBg = theme.isLight ? '#f1f5f9' : '#1f2937';
  const cardBg = theme.isLight ? '#f8fafc' : '#1f2937';
  const subText = theme.otherUsernameColor;
  const accent = theme.myMessageBackground || '#6366f1';

  return (
    <div
      ref={pickerRef}
      className="glass-strong pop-in fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-[999] rounded-2xl flex flex-col overflow-hidden sm:absolute sm:inset-x-auto sm:bottom-full sm:left-1/2 sm:translate-y-16 sm:-translate-x-1/2"
      style={{
        width: 'min(360px, calc(100vw - 24px))',
        height: 'min(420px, 62dvh)',
        maxHeight: '62dvh',
        zIndex: 100,
        border: `1px solid ${border}`,
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b sm:hidden" style={{ borderColor: border }}>
        <span className="text-xs font-semibold" style={{ color: theme.otherMessageText }}>
          {isRecent ? 'Recent' : activeTab === 'gifs' ? 'GIFs' : 'Stickers'}
        </span>
        <button type="button" onClick={onClose} className="p-1 rounded-full">
          <X className="w-4 h-4" style={{ color: subText }} />
        </button>
      </div>


      { }
      <div className="px-3 pb-1 flex-shrink-0 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: subText }}>
          {isRecent
            ? `Recent · ${recents.length}/${MAX_RECENT}`
            : mode === 'trending' ? 'Trending' : `Results for "${searchQuery}"`}
        </span>
        {isRecent && recents.length > 0 && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClearRecent}
            className="text-[10px] font-semibold hover:opacity-70 transition"
            style={{ color: subText }}
          >
            Clear
          </button>
        )}
      </div>

      { }
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {(!activeTab || (!isRecent && items.length === 0 && loading)) && (
          <div className="flex items-center justify-center h-full">
            <LoaderMini className="w-6 h-6 animate-spin" style={{ color: subText }} />
          </div>
        )}

        {activeTab && displayItems.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full px-6 text-center text-xs" style={{ color: subText }}>
            {isRecent
              ? 'Stickers and GIFs you use will show up here, even when you are offline.'
              : fetchFailed
                ? "Couldn't load. Check your connection, your Recent tab still works offline."
                : `No ${activeTab} found`}
          </div>
        )}

        <div className="grid grid-cols-4 sm:grid-cols-3 gap-1.5">
          {displayItems.map((d) => (
            <button
              key={d.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={d.onPick}
              className="rounded-xl overflow-hidden flex items-center justify-center transition-opacity hover:opacity-80"
              style={{ backgroundColor: cardBg, aspectRatio: '1 / 1' }}
            >
              <img
                src={d.src}
                alt={d.alt}
                className="w-full h-full object-contain p-1 sm:p-1"
                loading="lazy"
              />
            </button>
          ))}
        </div>

        {!isRecent && items.length > 0 && loading && (
          <div className="flex justify-center py-3">
            <LoaderMini className="w-4 h-4 animate-spin" style={{ color: subText }} />
          </div>
        )}
      </div>



      { }
      <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${border}` }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 text-xs font-semibold transition-colors"
            style={{
              color: activeTab === tab.id ? accent : subText,
              borderBottom: activeTab === tab.id ? `2px solid ${accent}` : '2px solid transparent',
              backgroundColor: 'transparent',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      { }
      {!isRecent && (
      <div className="flex items-center gap-2 px-3 pt-2 pb-2 flex-shrink-0">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-1.5"
          style={{ backgroundColor: inputBg }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: subText }} />
          <input
            type="text"
            placeholder={`Search ${base}...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent text-xs"
            style={{ color: theme.otherMessageText }}
          />
          {searchQuery && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleClearSearch}
              className="flex-shrink-0 hover:opacity-70 transition"
            >
              <X className="w-3 h-3" style={{ color: subText }} />
            </button>
          )}
        </div>
      </div>
      )}

      { }
      <div className="flex-shrink-0 px-3 py-1.5 flex justify-end"
        style={{ borderTop: `1px solid ${border}` }}>
        <span className="text-[9px] font-medium" style={{ color: subText, opacity: 0.6 }}>
          Powered by KLIPY
        </span>
      </div>
    </div>
  );
});

StickerPicker.displayName = 'StickerPicker';
export default StickerPicker;
