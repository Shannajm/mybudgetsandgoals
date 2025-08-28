import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="mr-3"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Financial Dashboard
          </h2>
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