import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Calendar, CreditCard, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyWithSign } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'bill_due' | 'bill_overdue' | 'loan_overdue' | 'goal_funded';
  title: string;
  description: string;
  amount?: number;
  currency?: string;
  targetRoute: string;
}

interface RecentAlertsProps {
  bills: any[];
  loans: any[];
  goals: any[];
}

const RecentAlerts: React.FC<RecentAlertsProps> = ({ bills, loans, goals }) => {
  const navigate = useNavigate();
  const alerts: Alert[] = [];
  const today = new Date();

  // Bills due within 3 days
  bills.forEach(bill => {
    const dueDate = new Date(bill.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= 3) {
      alerts.push({
        id: `bill_due_${bill.id}`,
        type: 'bill_due',
        title: `${bill.title} due ${diffDays === 0 ? 'today' : `in ${diffDays} day${diffDays > 1 ? 's' : ''}`}`,
        description: `Due ${bill.dueDate}`,
        amount: bill.amount,
        currency: bill.currency,
        targetRoute: '/bills'
      });
    }
  });

  // Overdue bills
  bills.forEach(bill => {
    const dueDate = new Date(bill.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      alerts.push({
        id: `bill_overdue_${bill.id}`,
        type: 'bill_overdue',
        title: `${bill.title} is overdue`,
        description: `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`,
        amount: bill.amount,
        currency: bill.currency,
        targetRoute: '/bills'
      });
    }
  });

  // Overdue loans
  loans.forEach(loan => {
    if (loan.nextPaymentDate) {
      const paymentDate = new Date(loan.nextPaymentDate);
      const diffTime = today.getTime() - paymentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        alerts.push({
          id: `loan_overdue_${loan.id}`,
          type: 'loan_overdue',
          title: `${loan.title} payment overdue`,
          description: `${diffDays} day${diffDays > 1 ? 's' : ''} overdue`,
          amount: loan.monthlyPayment,
          currency: loan.currency,
          targetRoute: '/loans'
        });
      }
    }
  });

  // Goals more than 75% funded
  goals.forEach(goal => {
    const progress = goal.currentAmount / goal.targetAmount;
    if (progress > 0.75 && progress < 1) {
      alerts.push({
        id: `goal_funded_${goal.id}`,
        type: 'goal_funded',
        title: `${goal.title} is ${Math.round(progress * 100)}% funded`,
        description: `${formatCurrencyWithSign(goal.currentAmount, goal.currency)} of ${formatCurrencyWithSign(goal.targetAmount, goal.currency)}`,
        targetRoute: '/goals'
      });
    }
  });

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'bill_due':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'bill_overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'loan_overdue':
        return <CreditCard className="h-4 w-4 text-red-500" />;
      case 'goal_funded':
        return <Target className="h-4 w-4 text-green-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleAlertClick = (alert: Alert) => {
    navigate(alert.targetRoute);
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Recent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => handleAlertClick(alert)}
              className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              {getIcon(alert.type)}
              <div className="flex-1">
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs text-gray-500">{alert.description}</p>
              </div>
              {alert.amount && (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {formatCurrencyWithSign(alert.amount, alert.currency)}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentAlerts;