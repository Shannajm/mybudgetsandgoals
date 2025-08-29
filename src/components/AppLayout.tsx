import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import Sidebar from './Sidebar';
import Header from './Header';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Accounts from '@/pages/Accounts';
import Transactions from '@/pages/Transactions';
import Bills from '@/pages/Bills';
import Income from '@/pages/Income';
import Goals from '@/pages/Goals';
import Loans from '@/pages/Loans';
import Settings from '@/pages/Settings';
import ProfileSettings from '@/pages/ProfileSettings';
import NotFound from '@/pages/NotFound';
import Reports from '@/pages/Reports';
import SpendingByCategory from '@/pages/Reports/SpendingByCategory';
import CashFlowOverTime from '@/pages/Reports/CashFlowOverTime';
import Savings from '@/pages/Savings';

const AppLayout: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => toggleSidebar(false)} />
      
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={() => toggleSidebar(false)}
        />
      )}
      
      <div className="flex flex-col">
        <Header onMenuClick={() => toggleSidebar(true)} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/income" element={<Income />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/reports" element={<Reports />}>
              <Route path="spending" element={<SpendingByCategory />} />
              <Route path="cash-flow" element={<CashFlowOverTime />} />
            </Route>
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/profile" element={<ProfileSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
