import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MoreVertical, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { Loan } from '@/services/LoanService';

interface LoanCardProps {
  loan: Loan;
  onEdit: (loan: Loan) => void;
  onDelete: (loan: Loan) => void;
  onMakePayment: (loan: Loan) => void;
}

const LoanCard: React.FC<LoanCardProps> = ({ loan, onEdit, onDelete, onMakePayment }) => {
  const progressPercent = ((loan.principal - loan.balance) / loan.principal) * 100;
  const nextDueDate = new Date(loan.nextDueDate);
  const isOverdue = nextDueDate < new Date();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Weekly';
      case 'bi-weekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      default: return frequency;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{loan.name}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(loan)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(loan)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Current Balance</span>
            <span className="font-medium text-red-600">{formatCurrency(loan.balance, loan.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Remaining Balance</span>
            <span className="font-medium">{formatCurrency(loan.balance, loan.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Paid to Date</span>
            <span className="font-medium text-green-600">{formatCurrency(loan.principal - loan.balance, loan.currency)}</span>
          </div>
          {typeof loan.paymentsMade === 'number' && (
            <div className="flex justify-between text-sm">
              <span>Payments Made</span>
              <span className="font-medium">{loan.paymentsMade}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span>Payment Amount</span>
            <span className="font-medium">{formatCurrency(loan.paymentAmount, loan.currency)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Frequency</span>
            <span className="font-medium">{getFrequencyLabel(loan.paymentFrequency)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Interest Rate</span>
            <span className="font-medium">{loan.interestRate}%</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Next Due</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatDate(loan.nextDueDate)}</span>
              {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{Math.round(progressPercent)}% paid</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Button 
          onClick={() => onMakePayment(loan)}
          className="w-full"
          variant={isOverdue ? "destructive" : "default"}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {isOverdue ? 'Pay Overdue' : 'Make Payment'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoanCard;
