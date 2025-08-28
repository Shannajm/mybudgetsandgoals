import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { Income } from '@/services/IncomeService';
import RecordIncomeModal from '@/components/modals/RecordIncomeModal';

interface IncomeCardProps {
  income: Income;
  accounts: any[];
  onEdit: (income: Income) => void;
  onDelete: (income: Income) => void;
}

const IncomeCard: React.FC<IncomeCardProps> = ({ income, accounts, onEdit, onDelete }) => {
  const [showRecordModal, setShowRecordModal] = useState(false);

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'Monthly': return 'bg-blue-100 text-blue-800';
      case 'Bi-weekly': return 'bg-green-100 text-green-800';
      case 'Weekly': return 'bg-purple-100 text-purple-800';
      case 'Quarterly': return 'bg-orange-100 text-orange-800';
      case 'Yearly': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNextPayment = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  const nextPayment = formatNextPayment(income.nextPaymentDate);
  const isUpcoming = nextPayment === 'Today' || nextPayment === 'Tomorrow' || nextPayment.includes('In');

  return (
    <>
      <Card className={`${isUpcoming ? 'border-green-500' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{income.sourceName}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(income)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(income)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{income.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(income.amount)}
            </span>
            <Badge className={getFrequencyColor(income.frequency)}>
              {income.frequency}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Account</span>
              <span className="font-medium">{getAccountName(income.accountId)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Next Payment</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  isUpcoming ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {nextPayment}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowRecordModal(true)}
                  className="text-xs px-2 py-1 h-6"
                >
                  💵 Record
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showRecordModal && (
        <RecordIncomeModal
          income={income}
          onClose={() => setShowRecordModal(false)}
        />
      )}
    </>
  );
};

export default IncomeCard;