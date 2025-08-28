import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, CreditCard, PiggyBank, Trash2, Plus, Edit } from 'lucide-react';
import { Account, accountService, StatementStatus } from '@/services/AccountService';
import { formatCurrency } from '@/lib/utils';

type Props = {
  account: Account;
  onClick?: () => void;                  // open quick panel
  onEdit?: (a: Account) => void;         // open edit modal
  onDelete?: (id: string) => void;       // open delete dialog
};

const AccountCard: React.FC<Props> = ({ account, onClick, onEdit, onDelete }) => {
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

  const Icon = getAccountIcon(account.type);
  const currentBalance = account.currentBalance ?? account.balance;
  const cur = account.currency || "USD";
  const balance = account.currentBalance ?? account.balance ?? 0;

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
    <Card
      className="rounded-xl border p-4 hover:bg-muted/50 cursor-pointer transition"
      onClick={onClick}                       // ✅ card click opens quick panel
      role="button"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-muted-foreground capitalize">{account.type}</div>
          <div className="text-lg font-semibold">{account.name}</div>
          <div className="mt-2 text-2xl font-bold">
            {formatCurrency(Math.abs(balance), cur)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Current Balance</div>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEdit?.(account); }}   // ✅ doesn't open panel
            aria-label="Edit account"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete?.(account.id); }} // ✅ doesn't open panel
            aria-label="Delete account"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* If you show credit details, keep that block here unchanged */}
    </Card>
  );
};

export default AccountCard;
