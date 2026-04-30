import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Sprout, User, LogOut, Menu, X, Leaf, MessageCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/feed', icon: Home, label: 'Home' },
  { to: '/inventory', icon: Sprout, label: 'My Garden' },
  { to: '/community', icon: MessageCircle, label: 'Community' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps): JSX.Element {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();

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
