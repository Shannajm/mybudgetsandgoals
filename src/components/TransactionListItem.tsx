import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { Transaction } from '@/services/TransactionService';
import { formatSigned, formatCurrency } from '@/lib/utils';
import { fxService } from '@/services/FxService';

interface TransactionListItemProps {
  transaction: Transaction;
  accountName: string;
  onEdit: (transaction: Transaction) => void;
  getAccountName?: (accountId: string) => string;
  getAccountCurrency?: (accountId: string) => string;
}

const TransactionListItem: React.FC<TransactionListItemProps> = ({ 
  transaction, 
  accountName, 
  onEdit,
  getAccountName,
  getAccountCurrency
}) => {
  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Dining': 'bg-orange-100 text-orange-800',
      'Salary': 'bg-green-100 text-green-800',
      'Utilities': 'bg-blue-100 text-blue-800',
      'Transfer': 'bg-purple-100 text-purple-800',
      'Transportation': 'bg-yellow-100 text-yellow-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const renderCrossCurrencyDisplay = () => {
    if (transaction.fxRate && transaction.fxFrom && transaction.fxTo && transaction.convertedAmount) {
      const sourceAmount = Math.abs(transaction.amount);
      const targetAmount = transaction.convertedAmount;
      
      return (
        <span className="text-xs text-blue-600 ml-2">
          (↔ {fxService.formatExchangeDisplay(
            sourceAmount,
            targetAmount,
            transaction.fxRate,
            transaction.fxFrom,
            transaction.fxTo
          )})
        </span>
      );
    }
    return null;
  };

  const renderTransferDisplay = () => {
    if (transaction.type === 'transfer_out' && transaction.relatedTransactionId) {
      const fromCurrency = getAccountCurrency ? getAccountCurrency(transaction.accountId) : 'USD';
      const rate = transaction.rate || 1;
      const convertedAmount = Math.abs(transaction.amount) * rate;
      
      return (
        <span className="text-xs text-gray-600 ml-2">
          (→ {fxService.formatExchangeDisplay(
            Math.abs(transaction.amount),
            convertedAmount,
            rate,
            fromCurrency,
            transaction.currency || 'USD'
          )})
        </span>
      );
    }
    
    if (transaction.type === 'transfer_in' && transaction.relatedTransactionId) {
      const toCurrency = getAccountCurrency ? getAccountCurrency(transaction.accountId) : 'USD';
      const rate = transaction.rate || 1;
      const originalAmount = transaction.amount / rate;
      
      return (
        <span className="text-xs text-gray-600 ml-2">
          (← {fxService.formatExchangeDisplay(
            originalAmount,
            transaction.amount,
            rate,
            transaction.currency || 'USD',
            toCurrency
          )})
        </span>
      );
    }
    
    return null;
  };

  const { text, color } = formatSigned(transaction.amount, transaction.type);
  const colorClass = color === 'red' ? 'text-red-600' : 'text-green-600';

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {transaction.description}
            {renderCrossCurrencyDisplay()}
            {renderTransferDisplay()}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${colorClass}`}>
              {text}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(transaction)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <Badge className={getCategoryBadgeColor(transaction.category)}>
              {transaction.category}
            </Badge>
            <span>{accountName}</span>
            {transaction.type === 'transfer' && transaction.fromAccountId && transaction.toAccountId && getAccountName && (
              <span className="text-xs">
                {getAccountName(transaction.fromAccountId)} → {getAccountName(transaction.toAccountId)}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>{transaction.date}</span>
            {transaction.balance && (
              <span className="text-gray-400">
                Balance: {formatCurrency(transaction.balance)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionListItem;