import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, Target, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyWithSign } from '@/lib/utils';

interface DashboardCardsProps {
  balancesByCurrency: Record<string, number>;
  monthlyIncome: number;
  monthlyExpenses: number;
  dueThisWeek: number;
  goalsSummary: { totalGoals: number; completedGoals: number; overallProgress: number };
}

const DashboardCards: React.FC<DashboardCardsProps> = ({
  balancesByCurrency,
  monthlyIncome,
  monthlyExpenses,
  dueThisWeek,
  goalsSummary
}) => {
  const navigate = useNavigate();

  const handleCardClick = (cardType: string) => {
    console.log(`Clicked ${cardType} card`);
    switch (cardType) {
      case 'balance':
        navigate('/accounts');
        break;
      case 'income':
        navigate('/transactions?type=income');
        break;
      case 'expenses':
        navigate('/transactions?type=expense');
        break;
      case 'bills':
        navigate('/bills');
        break;
      case 'goals':
        navigate('/goals');
        break;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card 
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
        onClick={() => handleCardClick('balance')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">
            Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {Object.entries(balancesByCurrency).map(([currency, balance]) => (
                <div key={currency} className="text-lg font-bold">
                  {formatCurrencyWithSign(balance, currency)}
                </div>
              ))}
            </div>
            <Wallet className="h-8 w-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card 
        className="bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
        onClick={() => handleCardClick('income')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">
            This Month Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrencyWithSign(monthlyIncome)}</div>
            <TrendingUp className="h-8 w-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card 
        className="bg-gradient-to-r from-red-500 to-red-600 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
        onClick={() => handleCardClick('expenses')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">
            This Month Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrencyWithSign(monthlyExpenses)}</div>
            <TrendingDown className="h-8 w-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card 
        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
        onClick={() => handleCardClick('bills')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">
            Due This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrencyWithSign(dueThisWeek)}</div>
            <Calendar className="h-8 w-8 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card 
        className="bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
        onClick={() => handleCardClick('goals')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">
            Goals Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{Math.round(goalsSummary.overallProgress)}%</div>
            <Target className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-xs opacity-80 mt-1">
            {goalsSummary.completedGoals}/{goalsSummary.totalGoals} completed
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCards;