import React, { useState } from 'react';
import { 
  Newspaper, 
  Search, 
  Bookmark, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  X,
  LogIn,
  LogOut,
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  categories: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefreshNews: () => void;
  isRefreshing: boolean;
  bookmarkCount: number;
  onOpenBookmarks: () => void;
  user?: User | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  systemStatus?: {
    healthy: boolean;
    cachingMode: string;
    nlpEngine: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeCategory,
  onSelectCategory,
  categories,
  searchQuery,
  onSearchChange,
  onRefreshNews,
  isRefreshing,
  bookmarkCount,
  onOpenBookmarks,
  user,
  onOpenAuth,
  onLogout,
  systemStatus,
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand Logo */}
        <div className="flex items-center justify-between">
          <div 
            onClick={() => { onSelectCategory('all'); onSearchChange(''); setLocalSearch(''); }}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">News Aggregator</span>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex items-center space-x-1.5 md:hidden">
            <button
              onClick={onRefreshNews}
              disabled={isRefreshing}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
              title="Refresh News"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onOpenBookmarks}
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
              title="Saved Bookmarks"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarkCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {bookmarkCount}
                </span>
              )}
            </button>
            {user && user.role === 'user' ? (
              <button
                onClick={onLogout}
                className="p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-2.5 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-sm transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xl mx-0 md:mx-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search across trusted publishers, topics, keywords..."
              className="w-full pl-10 pr-10 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 rounded-xl border border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* Action Controls */}
        <div className="hidden md:flex items-center space-x-2">
          <button
            onClick={onRefreshNews}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
            title="Ingest latest stories from configured providers"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>

          <button
            onClick={onOpenBookmarks}
            className="relative flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
          >
            <Bookmark className="w-4 h-4" />
            <span>Bookmarks</span>
            {bookmarkCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                {bookmarkCount}
              </span>
            )}
          </button>

          {/* User Profile / Guest Sign In Button */}
          <div className="relative ml-2 pl-2 border-l border-slate-200">
            {user && user.role === 'user' ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {(user.name || user.email)[0]}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name || user.email.split('@')[0]}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.name || 'Reader'}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setIsUserMenuOpen(false); onOpenBookmarks(); }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                      <span>Saved Articles ({bookmarkCount})</span>
                    </button>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { setIsUserMenuOpen(false); onLogout?.(); }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm shadow-blue-500/20 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="flex items-center space-x-1 py-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? 'All Headlines' : cat}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
