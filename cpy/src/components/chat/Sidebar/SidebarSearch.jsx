import { Search } from 'lucide-react';
import { useNeumorphism } from '../../../hooks/useNeumorphism';

const SidebarSearch = ({ searchQuery, setSearchQuery }) => {
  const { theme, getInputProps } = useNeumorphism();

  return (
    <div className="p-3 md:p-5 border-b" style={{ borderColor: theme.isLight ? '#cbd5e0' : '#4a5568' }}>
      <div className="relative">
        <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5" style={{ color: theme.otherUsernameColor, opacity: 0.7 }} />
        <input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 border-none focus:border-transparent focus:ring-0 rounded-2xl focus:outline-none text-sm md:text-base transition-all"
          {...getInputProps(1, 3, 2, 4)}
        />
      </div>
    </div>
  );
};

export default SidebarSearch;
