import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CreditCard, DollarSign, ArrowRightLeft } from 'lucide-react';
import { Bill } from '@/services/BillService';
import { formatCurrencyWithSign } from '@/lib/utils';

interface BillCardProps {
  bill: Bill;
  onEditBill: (bill: Bill) => void;
  onDeleteBill: (bill: Bill) => void;
  onPayBill: (bill: Bill) => void;
  getAccountName: (accountId: string) => string;
  getAccountCurrency: (accountId: string) => string;
}

const BillCard: React.FC<BillCardProps> = ({ 
  bill, 
  onEditBill, 
  onDeleteBill, 
  onPayBill,
  getAccountName,
  getAccountCurrency
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'due-soon':
        return <Badge variant="destructive">Due Soon</Badge>;
      case 'upcoming':
        return <Badge variant="outline">Upcoming</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Housing': 'bg-blue-100 text-blue-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
      'Insurance': 'bg-purple-100 text-purple-800',
      'Subscriptions': 'bg-green-100 text-green-800',
      'Loans': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue(bill.dueDate);
  const billCurrency = bill.currency || 'USD';
  const accountCurrency = getAccountCurrency(bill.accountId);
  const isCrossCurrency = billCurrency !== accountCurrency;
  const hasFxRate = bill.status === 'paid' && isCrossCurrency;

  return (
    <div
      className={`p-4 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 group ${
        bill.status === 'due-soon' || bill.status === 'overdue' 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
          : 'bg-white dark:bg-gray-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
              {bill.source === 'loan' && <CreditCard className="h-4 w-4 mr-2 text-orange-600" />}
              {bill.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrencyWithSign(bill.amount, billCurrency)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPayBill(bill)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 hover:text-green-700"
                title="Pay Bill"
              >
                <DollarSign className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditBill(bill)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {bill.source === 'loan' ? <CreditCard className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
              {bill.source === 'bill' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteBill(bill)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className={getCategoryColor(bill.category)}>
                {bill.category}
              </Badge>
              {getStatusBadge(bill.status || 'upcoming')}
              {hasFxRate && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <ArrowRightLeft className="h-3 w-3 mr-1" />
                  Rate Applied
                </Badge>
              )}
              <span className="text-sm text-gray-500 capitalize">
                {bill.frequency}
              </span>
              <span className="text-sm text-gray-500">
                {getAccountName(bill.accountId)}
                {isCrossCurrency && ` (${accountCurrency})`}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Due {formatDate(bill.dueDate)} ({daysUntilDue} days)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillCard;