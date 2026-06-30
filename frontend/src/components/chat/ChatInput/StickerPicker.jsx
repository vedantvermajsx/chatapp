import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const API_KEY = import.meta.env.VITE_KLIPY_API_KEY;
console.log("key" + API_KEY)
const STICKER_BASE = `https://api.klipy.com/api/v1/${API_KEY}/stickers`;
const GIF_BASE = `https://api.klipy.com/api/v1/${API_KEY}/gifs`;


const getMediaUrl = (file) => {
  if (!file) return null;
  return file.xs?.webp?.url || file.xs?.gif?.url || null;
};

const TABS = [
  { id: 'stickers', label: 'Stickers' },
  { id: 'gifs', label: 'GIFs' },
];

const StickerPicker = memo(({ onStickerSelect, pickerRef }) => {
  const { theme } = useTheme();
  const { getShadow } = useNeumorphism();

  const [activeTab, setActiveTab] = useState('stickers');
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [mode, setMode] = useState('trending');

  const searchTimeoutRef = useRef(null);
  const currentQueryRef = useRef('');

  const base = activeTab === 'stickers' ? STICKER_BASE : GIF_BASE;

  const fetchItems = useCallback(async (q, pg, reset, tabBase) => {
    if (loading) return;
    setLoading(true);
    try {
      const url = q
        ? `${tabBase}/search?q=${encodeURIComponent(q)}&page=${pg}&per_page=12`
        : `${tabBase}/trending?page=${pg}&per_page=12`;

      const res = await fetch(url);
      const json = await res.json();

      const list = json?.data?.data || [];
      const next = json?.data?.has_next ?? false;

      setItems(prev => reset ? list : [...prev, ...list]);
      setHasNext(next);
      setPage(pg);
    } catch (e) {
      console.error('Klipy fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [loading]);


  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasNext(true);
    setSearchQuery('');
    setMode('trending');
    currentQueryRef.current = '';
    fetchItems('', 1, true, activeTab === 'stickers' ? STICKER_BASE : GIF_BASE);

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
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && hasNext && !loading) {
      fetchItems(currentQueryRef.current, page + 1, false, base);
    }
  };

  const handleSelect = (item) => {
    const url = getMediaUrl(item.file);
    if (!url) return;
    onStickerSelect({ type: activeTab === 'stickers' ? 'sticker' : 'gif', url });
  };

  const border = theme.isLight ? '#e2e8f0' : '#374151';
  const inputBg = theme.isLight ? '#f1f5f9' : '#1f2937';
  const cardBg = theme.isLight ? '#f8fafc' : '#1f2937';
  const subText = theme.otherUsernameColor;
  const accent = theme.myMessageBackground || '#6366f1';

  return (
    <div
      ref={pickerRef}
      className="sticky bottom-full left-1/4 -translate-x-6 mb-5 z-50 rounded-2xl flex flex-col overflow-hidden"
      style={{
        width: 'min(320px, calc(100vw - 40px))',
        height: '420px',
        backgroundColor: theme.background,
        boxShadow: getShadow(theme.isLight, false, 4, 12),
        border: `1px solid ${border}`,
      }}
    >
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
      <div className="flex items-center gap-2 px-3 pt-2 pb-2 flex-shrink-0">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-1.5"
          style={{ backgroundColor: inputBg }}>
          <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: subText }} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent text-xs outline-none"
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

      { }
      <div className="px-3 pb-1 flex-shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: subText }}>
          {mode === 'trending' ? 'Trending' : `Results for "${searchQuery}"`}
        </span>
      </div>

      { }
      <div
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 pb-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {items.length === 0 && loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: subText }} />
          </div>
        )}

        {items.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-xs" style={{ color: subText }}>
            No {activeTab} found
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5">
          {items.map((item, i) => {
            const url = getMediaUrl(item.file);
            if (!url) return null;
            return (
              <button
                key={item.id || i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="rounded-xl overflow-hidden flex items-center justify-center transition-transform hover:scale-105 hover:opacity-90"
                style={{ backgroundColor: cardBg, aspectRatio: '1 / 1' }}
              >
                <img
                  src={url}
                  alt={item.title || activeTab}
                  className="w-full h-full object-contain p-1"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>

        {items.length > 0 && loading && (
          <div className="flex justify-center py-3">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: subText }} />
          </div>
        )}
      </div>

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
