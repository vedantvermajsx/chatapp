import { Search, X } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const SidebarSearch = ({ searchQuery, setSearchQuery }) => {
  const { theme, getInputProps } = useNeumorphism();
  const border = theme.isLight ? '#cbd5e0' : '#4a5568';

  return (
    <div className="px-4 md:px-5 py-3 flex-shrink-0" style={{ borderColor: border }}>
      <div className="relative flex items-center">
        <Search
          className="absolute left-4 w-3.5 h-3.5 pointer-events-none"
          style={{ color: theme.otherUsernameColor, opacity: 0.6 }}
        />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-8 py-2.5 rounded-xl border-none text-sm transition-all"
          {...getInputProps(1, 3, 2, 2)}
          style={{ ...getInputProps(1, 3, 2, 2).style, color: theme.otherMessageText }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" style={{ color: theme.otherUsernameColor }} />
          </button>
        )}
      </div>
    </div>
  );
};

export default SidebarSearch;
