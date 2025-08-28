import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CreditCard, Target, Receipt, DollarSign } from 'lucide-react';
import { accountService } from '@/services/AccountService';
import { goalService } from '@/services/GoalService';
import { transactionService } from '@/services/TransactionService';
import { billService } from '@/services/BillService';

interface OnboardingPromptProps {
  onAddAccount: () => void;
  onAddGoal: () => void;
  onAddTransaction: () => void;
  onAddBill: () => void;
}

export function OnboardingPrompt({ onAddAccount, onAddGoal, onAddTransaction, onAddBill }: OnboardingPromptProps) {
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkForData();
  }, []);

  const checkForData = async () => {
    try {
      const [accounts, goals, transactions, bills] = await Promise.all([
        accountService.getAll(),
        goalService.getAll(),
        transactionService.getAll(),
        billService.getAll()
      ]);
      
      const hasAnyData = accounts.length > 0 || goals.length > 0 || transactions.length > 0 || bills.length > 0;
      setHasData(hasAnyData);
    } catch (error) {
      console.error('Error checking for data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || hasData) {
    return null;
  }

  return (
    <Card className="mb-6 border-dashed border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="text-center">
        <CardTitle className="text-xl text-blue-900">Welcome to Your Financial Dashboard!</CardTitle>
        <p className="text-blue-700 mt-2">Get started by adding your first account, goal, transaction, or bill.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={onAddAccount}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 border-blue-200"
          >
            <CreditCard className="h-8 w-8 text-blue-600" />
            <span className="font-medium">Add Account</span>
            <span className="text-sm text-gray-600">Start tracking your finances</span>
          </Button>
          
          <Button
            onClick={onAddGoal}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 border-green-200"
          >
            <Target className="h-8 w-8 text-green-600" />
            <span className="font-medium">Set Goal</span>
            <span className="text-sm text-gray-600">Plan for the future</span>
          </Button>
          
          <Button
            onClick={onAddTransaction}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 border-purple-200"
          >
            <DollarSign className="h-8 w-8 text-purple-600" />
            <span className="font-medium">Add Transaction</span>
            <span className="text-sm text-gray-600">Record income or expense</span>
          </Button>
          
          <Button
            onClick={onAddBill}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-orange-50 border-orange-200"
          >
            <Receipt className="h-8 w-8 text-orange-600" />
            <span className="font-medium">Add Bill</span>
            <span className="text-sm text-gray-600">Never miss a payment</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}