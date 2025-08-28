import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, CreditCard, PiggyBank, Trash2, Plus } from 'lucide-react';
import { Account, accountService, StatementStatus } from '@/services/AccountService';
import { formatCurrency } from '@/lib/utils';

interface AccountCardProps {
  account: Account;
  onClick: () => void;
  onDelete: (account: Account) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, onClick, onDelete }) => {
  const [statementStatus, setStatementStatus] = useState<StatementStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account.type === 'credit' && account.statementDate && account.statementAmount) {
      setLoading(true);
      accountService.getStatementStatus(account.id)
        .then(setStatementStatus)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [account.id, account.type, account.statementDate, account.statementAmount]);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return Wallet;
      case 'savings': return PiggyBank;
      case 'credit': return CreditCard;
      default: return Wallet;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'checking': return 'bg-blue-500';
      case 'savings': return 'bg-green-500';
      case 'credit': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'checking': return 'Checking';
      case 'savings': return 'Savings';
      case 'credit': return 'Credit Card';
      default: return type;
    }
  };

  const formatCreditBalance = (balance: number) => {
    const isPositive = balance > 0;
    const className = isPositive ? 'text-red-600' : 'text-green-600';
    const prefix = isPositive ? '' : '+';
    return {
      text: `${prefix}${formatCurrency(Math.abs(balance), account.currency)}`,
      className
    };
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(account);
  };

  const Icon = getAccountIcon(account.type);
  const currentBalance = account.currentBalance ?? account.balance;

  const getStatementDateLabel = (day: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const currentMonth = now.getMonth();
    let statementMonth = currentMonth;
    if (day > now.getDate()) {
      statementMonth = currentMonth - 1;
      if (statementMonth < 0) statementMonth = 11;
    }
    return `${months[statementMonth]} ${day}`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3" onClick={onClick}>
            <div className={`p-2 rounded-lg ${getAccountColor(account.type)} text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <Badge variant="outline" className="text-xs mt-1">
                {getAccountTypeLabel(account.type)}
              </Badge>
              {account.is_seed && (
                <div className="text-xs text-orange-600 mt-1">
                  This is an example item—delete it before you add your own.
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent onClick={onClick}>
        {account.type === 'credit' ? (
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Credit Limit: {formatCurrency(account.creditLimit || 0, account.currency)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Available Credit: {formatCurrency((account.creditLimit || 0) - currentBalance, account.currency)}
            </div>
            <div className="text-lg font-bold">
              Current Balance: <span className={formatCreditBalance(currentBalance).className}>
                {formatCreditBalance(currentBalance).text}
              </span>
            </div>
            
            {/* Statement Status Section */}
            {account.statementDate && account.statementAmount && statementStatus ? (
              <div className="mt-4 pt-3 border-t space-y-1">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Statement: {formatCurrency(statementStatus.statementAmount, account.currency)} 
                  <span className="text-xs ml-1">(as of {getStatementDateLabel(account.statementDate)})</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Paid this cycle: {formatCurrency(statementStatus.amountPaidThisCycle, account.currency)}
                </div>
                <div className="text-sm font-medium">
                  Owed on statement: <span className={statementStatus.owedOnStatement === 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(statementStatus.owedOnStatement, account.currency)}
                  </span>
                </div>
              </div>
            ) : account.type === 'credit' ? (
              <div className="mt-4 pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { e.stopPropagation(); onClick(); }}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add statement details
                </Button>
              </div>
            ) : null}
            
            {loading && (
              <div className="text-xs text-gray-500 mt-2">Loading statement status...</div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {formatCurrency(currentBalance, account.currency)}
            </div>
            <div className="text-sm text-gray-500">
              Current Balance
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountCard;