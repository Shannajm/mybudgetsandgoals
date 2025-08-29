import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import NotificationDropdown from './NotificationDropdown';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const isMobile = useIsMobile();
  const location = useLocation();

  const nav = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Accounts', href: '/accounts' },
    { name: 'Transactions', href: '/transactions' },
    { name: 'Bills', href: '/bills' },
    { name: 'Goals', href: '/goals' },
    { name: 'Loans', href: '/loans' },
    { name: 'Reports', href: '/reports' },
  ];

  const isActive = (href: string) =>
    location.pathname === href || (href === '/dashboard' && location.pathname === '/');

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="mr-1"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {/* Top navigation tabs for desktop */}
          {!isMobile && (
            <nav className="flex items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  to={n.href}
                  className={
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors ' +
                    (isActive(n.href)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800')
                  }
                >
                  {n.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <NotificationDropdown />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;
