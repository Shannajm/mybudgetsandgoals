import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Home,
  LayoutDashboard, 
  Wallet, 
  ArrowUpDown, 
  Calendar, 
  DollarSign, 
  PiggyBank,
  Target, 
  CreditCard, 
  BarChart3, 
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const navigation = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
  { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
  { name: 'Bills', href: '/bills', icon: Calendar },
  { name: 'Income', href: '/income', icon: DollarSign },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Fixed Savings', href: '/fixed-savings', icon: PiggyBank },
  { name: 'Loans', href: '/loans', icon: CreditCard },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: BarChart3,
    children: [
      { name: 'Spending by Category', href: '/reports/spending' },
      { name: 'Cash Flow', href: '/reports/cash-flow' }
    ]
  },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Reports']);

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  return (
    <div className={cn(
      'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="https://mybudgetsandgoals.com/BudgetAndGoalsLogo.png" alt="My Budgets & Goals" className="h-6 w-auto" />
            <h1
              className="text-xl font-bold text-gray-900 dark:text-white max-w-[9.5rem] truncate"
              title="My Budgets & Goals"
            >
              My Budgets & Goals
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || (item.href === '/home' && location.pathname === '/');
            const isExpanded = expandedItems.includes(item.name);
            const hasChildren = !isMobile && item.children && item.children.length > 0;
            
            return (
              <div key={item.name}>
                <div className="flex items-center">
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    )}
                    onClick={onClose}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8"
                      onClick={() => toggleExpanded(item.name)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children?.map((child) => {
                      const isChildActive = location.pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={cn(
                            'block px-3 py-2 text-sm rounded-md transition-colors',
                            isChildActive
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                          )}
                          onClick={onClose}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
