import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { accountService } from '@/services/AccountService';
import { billService } from '@/services/BillService';
import { transactionService } from '@/services/TransactionService';
import { Account } from '@/services/AccountService';
import { Bill } from '@/services/BillService';
import { Transaction } from '@/services/TransactionService';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: (open?: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  accounts: Account[];
  bills: Bill[];
  transactions: Transaction[];
  loading: boolean;
  refreshData: () => Promise<void>;
  accountsVersion: number;
  dashboardVersion: number;
  reloadAccounts: () => void;
  reloadDashboardData: () => void;
  reloadBills: () => void;
  reloadIncome: () => void;
  reloadGoals: () => void;
  reloadLoans: () => void;
  reloadAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsVersion, setAccountsVersion] = useState(0);
  const [dashboardVersion, setDashboardVersion] = useState(0);

  const toggleSidebar = (open?: boolean) => {
    setSidebarOpen(open !== undefined ? open : !sidebarOpen);
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setAccounts([]);
        setBills([]);
        setTransactions([]);
        return;
      }

      console.log('[DATA] Fetching all data for user:', currentUser.uid);
      const [accountsData, billsData, transactionsData] = await Promise.all([
        accountService.getAll(),
        billService.getAll(),
        transactionService.getAll()
      ]);

      setAccounts(accountsData);
      setBills(billsData);
      setTransactions(transactionsData);
      console.log('[DATA] Fetched:', accountsData.length, 'accounts,', billsData.length, 'bills,', transactionsData.length, 'transactions');
    } catch (error) {
      console.error('[DATA] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchAllData();
  };

  // Fetch data on mount and when user changes
  useEffect(() => {
    fetchAllData();
  }, [user, accountsVersion, dashboardVersion]);

  const reloadAccounts = () => setAccountsVersion(v => v + 1);
  const reloadDashboardData = () => setDashboardVersion(v => v + 1);
  const reloadBills = () => { setDashboardVersion(v => v + 1); };
  const reloadIncome = () => { setDashboardVersion(v => v + 1); };
  const reloadGoals = () => { setDashboardVersion(v => v + 1); };
  const reloadLoans = () => { setDashboardVersion(v => v + 1); };
  const reloadAll = () => { setAccountsVersion(v => v + 1); setDashboardVersion(v => v + 1); };

  const value = {
    sidebarOpen,
    toggleSidebar,
    user,
    setUser,
    accounts,
    bills,
    transactions,
    loading,
    refreshData,
    accountsVersion,
    dashboardVersion,
    reloadAccounts,
    reloadDashboardData,
    reloadBills,
    reloadIncome,
    reloadGoals,
    reloadLoans,
    reloadAll,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
