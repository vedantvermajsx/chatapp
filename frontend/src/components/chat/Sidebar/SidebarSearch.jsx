import { Search, X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const SidebarSearch = ({ searchQuery, setSearchQuery }) => {
  const { theme } = useTheme();
  const searchBg = theme.isLight ? '#e3e5e8' : '#1e1f22';

  return (
    <div className="px-2 py-2 flex-shrink-0">
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 w-3.5 h-3.5 pointer-events-none"
          style={{ color: theme.isLight ? '#4e5058' : '#949ba4' }}
        />
        <input
          type="text"
          placeholder="Find or start a conversation"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-[6px] rounded-md border-none text-[14px] transition-all leading-5"
          style={{
            backgroundColor: searchBg,
            color: theme.isLight ? '#313338' : '#dbdee1',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.backgroundColor = theme.background;
          }}
          onBlur={(e) => {
            e.target.style.backgroundColor = searchBg;
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 p-0.5 rounded transition-opacity"
            style={{ color: theme.isLight ? '#4e5058' : '#949ba4' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarSearch;
