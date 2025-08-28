import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { billService } from '@/services/BillService';
import { goalService } from '@/services/GoalService';
import { loanService } from '@/services/LoanService';
import { useAppContext } from '@/contexts/AppContext';
import { formatCurrencyWithSign } from '@/lib/utils';
import { OnboardingPrompt } from '@/components/OnboardingPrompt';
import QuickActions from '@/components/QuickActions';
import DashboardCards from '@/components/DashboardCards';

const Dashboard: React.FC = () => {
  const { dashboardVersion, accountsVersion } = useAppContext();
  const [balancesByCurrency, setBalancesByCurrency] = useState<Record<string, number>>({});
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [dueThisWeek, setDueThisWeek] = useState(0);
  const [goalsSummary, setGoalsSummary] = useState({ totalGoals: 0, completedGoals: 0, overallProgress: 0 });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [dashboardVersion, accountsVersion]);

  const loadDashboardData = async () => {
    try {
      const [accounts, transactions, billsData, goalsSummaryData] = await Promise.all([
        accountService.getAll(),
        transactionService.getAll(),
        billService.getAll(),
        goalService.getSummary()
      ]);

      const currencyBalances: Record<string, number> = {};
      accounts.forEach(acc => {
        const balance = acc.currentBalance || acc.balance;
        const amount = acc.type === 'credit' ? -balance : balance;
        currencyBalances[acc.currency] = (currencyBalances[acc.currency] || 0) + amount;
      });
      setBalancesByCurrency(currencyBalances);

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyTxns = transactions.filter(txn => {
        const txnDate = new Date(txn.date);
        return txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear;
      });

      const income = monthlyTxns
        .filter(txn => txn.type === 'income')
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
      
      const expenses = monthlyTxns
        .filter(txn => txn.type === 'expense')
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
      setGoalsSummary(goalsSummaryData);

      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weeklyBills = billsData.filter(bill => {
        const dueDate = new Date(bill.dueDate);
        return dueDate >= today && dueDate <= weekFromNow;
      }).reduce((sum, bill) => sum + bill.amount, 0);
      setDueThisWeek(weeklyBills);

      const recent = transactions.slice(0, 3);
      setRecentTransactions(recent);

      const upcoming = billsData
        .filter(bill => {
          const dueDate = new Date(bill.dueDate);
          const today = new Date();
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 30;
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 3);
      
      setUpcomingBills(upcoming);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        </div>
        <div className="text-center py-8">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <Badge variant="outline" className="text-sm">
          Last updated: Just now
        </Badge>
      </div>

      <OnboardingPrompt 
        onAddAccount={() => {}}
        onAddGoal={() => {}}
        onAddTransaction={() => {}}
        onAddBill={() => {}}
      />

      <QuickActions />

      <DashboardCards 
        balancesByCurrency={balancesByCurrency}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        dueThisWeek={dueThisWeek}
        goalsSummary={goalsSummary}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{txn.description}</p>
                    <p className="text-sm text-gray-500">{new Date(txn.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`font-medium ${
                    txn.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {txn.amount > 0 ? '+' : ''}{formatCurrencyWithSign(txn.amount)}
                  </span>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingBills.map((bill) => {
                const daysUntilDue = Math.ceil((new Date(bill.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntilDue <= 3;
                
                return (
                  <div key={bill.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                    isUrgent 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div>
                      <p className="font-medium">{bill.title}</p>
                      <p className="text-sm text-gray-500">{bill.dueDate}</p>
                    </div>
                    <span className={`font-medium ${
                      isUrgent ? 'text-orange-600' : 'text-gray-600'
                    }`}>
                      {formatCurrencyWithSign(bill.amount, bill.currency)}
                    </span>
                  </div>
                );
              })}
              {upcomingBills.length === 0 && (
                <p className="text-gray-500 text-center py-4">No upcoming bills</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;