import { useState } from 'react';
import { Leaf, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggle = () => setSidebarOpen((o) => !o);
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-bg-main">
      <Sidebar isOpen={sidebarOpen} onToggle={toggle} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-border-default bg-bg-card flex-shrink-0">
          <button
            onClick={toggle}
            aria-label="Open navigation"
            className="w-10 h-10 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-muted hover:text-text-base transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5 ml-2">
            <Leaf size={20} className="text-primary" aria-hidden />
            <span className="text-base font-bold text-text-base">RootShare</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
