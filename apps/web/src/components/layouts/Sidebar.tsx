import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Sprout, User, LogOut, Menu, X, Leaf, MessageCircle, Bot, Search } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { IUser } from '@rootshare/shared-types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/feed', icon: Home, label: 'Home' },
  { to: '/inventory', icon: Sprout, label: 'My Garden' },
  { to: '/community', icon: MessageCircle, label: 'Community' },
  { to: '/ai-chat', icon: Bot, label: 'Plant Assistant' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps): JSX.Element {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IUser[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSearch) { setQuery(''); setResults([]); return; }
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [showSearch]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await api.get<IUser[]>('/users/search', { params: { query } });
      setResults(data);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function handleUserClick(userId: string) {
    setShowSearch(false);
    navigate(`/profile/${userId}`);
  }

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        aria-label="Navigation sidebar"
        className={cn(
          'fixed top-0 left-0 h-full z-30 flex flex-col bg-bg-card border-r border-border-default transition-all duration-300 lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0 w-64 lg:w-60' : '-translate-x-full lg:translate-x-0 lg:w-16',
        )}
      >
        <div className="flex items-center gap-2 px-2 py-3 border-b border-border-muted h-14 flex-shrink-0">
          <button
            onClick={onToggle}
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={isOpen}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-muted hover:text-text-base transition-colors"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {isOpen && (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Leaf size={20} className="text-primary flex-shrink-0" aria-hidden />
              <span className="text-base font-bold text-text-base truncate">RootShare</span>
            </div>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2 py-3">
          <div className="relative" ref={searchRef}>
            <button
              type="button"
              onClick={() => setShowSearch((v) => !v)}
              className={cn(
                'h-10 px-2 rounded-md text-sm font-medium transition-colors flex items-center gap-3 w-full',
                isOpen ? '' : 'lg:justify-center',
                showSearch ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg-muted hover:text-text-base',
              )}
              aria-label="Search users"
            >
              <Search size={18} className="flex-shrink-0" aria-hidden />
              {isOpen && <span className="truncate">Search</span>}
            </button>

            {showSearch && (
              <div className="absolute left-full top-0 ml-2 w-72 bg-bg-card border border-border-default rounded-xl shadow-soft-lg z-50 overflow-hidden">
                <div className="p-3 border-b border-border-muted">
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border-input bg-bg-main text-text-base placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {results.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-6">
                      {query.trim() ? 'No users found' : 'Start typing to search'}
                    </p>
                  ) : (
                    results.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleUserClick(u.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-muted transition-colors text-left"
                      >
                        {u.localProfileImageUrl ?? u.profileImageUrl ? (
                          <img src={u.localProfileImageUrl ?? u.profileImageUrl ?? ''} alt={u.username} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-primary-foreground">
                              {u.username.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-text-base truncate">{u.username}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => window.innerWidth < 1024 && isOpen && onToggle()}
              className={({ isActive }) =>
                cn(
                  'h-10 px-2 rounded-md text-sm font-medium transition-colors flex items-center gap-3',
                  isOpen ? '' : 'lg:justify-center',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-bg-muted hover:text-text-base',
                )
              }
            >
              <Icon size={18} className="flex-shrink-0" aria-hidden />
              {isOpen && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-border-muted flex-shrink-0">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full h-10 px-2 rounded-md text-sm font-medium transition-colors flex items-center gap-3 text-destructive hover:bg-bg-muted',
              isOpen ? '' : 'lg:justify-center',
            )}
          >
            <LogOut size={18} className="flex-shrink-0" aria-hidden />
            {isOpen && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
