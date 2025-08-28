import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { goalService } from '@/services/GoalService';
import { billService } from '@/services/BillService';
import { loanService } from '@/services/LoanService';
import { accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import RecentAlerts from '@/components/RecentAlerts';
import FeatureNavigationCards from '@/components/FeatureNavigationCards';
import GettingStartedBanner from '@/components/GettingStartedBanner';

const Home: React.FC = () => {
  const { user } = useAppContext();
  const [goalProgress, setGoalProgress] = useState(0);
  const [bills, setBills] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [hasAnyData, setHasAnyData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [goalsSummary, billsData, loansData, goalsData, accounts, transactions] = await Promise.all([
        goalService.getSummary(),
        billService.getAll(),
        loanService.getAll(),
        goalService.getAll(),
        accountService.getAll(),
        transactionService.getAll()
      ]);
      
      setGoalProgress(Math.round(goalsSummary.overallProgress));
      setBills(billsData);
      setLoans(loansData);
      setGoals(goalsData);
      
      // Check if user has any data
      const totalRecords = accounts.length + transactions.length + billsData.length + goalsData.length + loansData.length;
      setHasAnyData(totalRecords > 0);
    } catch (error) {
      console.error('Error loading home data:', error);
      setGoalProgress(0);
      setHasAnyData(false);
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.displayName || user?.email || 'there';

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome, {displayName}!
          </h1>
          {hasAnyData && (
            <p className="text-xl text-gray-600 dark:text-gray-300">
              You're {goalProgress}% toward your goals.
            </p>
          )}
        </div>
        
        <div className="mt-8 space-y-6">
          <GettingStartedBanner hasAnyData={hasAnyData} />
          
          {hasAnyData && (
            <RecentAlerts bills={bills} loans={loans} goals={goals} />
          )}
          
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              Quick Access
            </h2>
            <FeatureNavigationCards />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;