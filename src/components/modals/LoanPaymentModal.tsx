import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Loan } from '@/services/LoanService';
import { Account, accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { formatCurrencyWithSign } from '@/lib/utils';
import { cn } from '@/lib/utils';
import CurrencyConverter from '../forms/CurrencyConverter';
import { useToast } from '@/hooks/use-toast';

interface LoanPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  accounts: Account[];
  onMakePayment: (loanId: string, accountId: string, amount: number, date: string) => Promise<void>;
}

const LoanPaymentModal: React.FC<LoanPaymentModalProps> = ({
  isOpen,
  onClose,
  loan,
  accounts,
  onMakePayment
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && loan) {
      setSelectedAccountId('');
      setPaymentAmount(loan.paymentAmount || 0);
      setPaymentDate(new Date());
      setSelectedAccount(null);
      setConversionRate(1);
      setConvertedAmount(loan.paymentAmount || 0);
    }
  }, [isOpen, loan]);

  useEffect(() => {
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      setSelectedAccount(account || null);
    }
  }, [selectedAccountId, accounts]);

  useEffect(() => {
    setConvertedAmount(paymentAmount);
  }, [paymentAmount]);

  const updateAccountBalance = async (accountId: string, amount: number) => {
    const account = await accountService.getById(accountId);
    if (!account) return;

    if (account.type === 'credit') {
      const newBalance = account.balance + amount;
      const newAvailableCredit = (account.creditLimit || 0) - newBalance;
      await accountService.update(accountId, {
        currentBalance: newBalance,
        availableCredit: newAvailableCredit
      });
    } else {
      await accountService.update(accountId, {
        currentBalance: account.balance - amount
      });
    }
  };

  const handleMakePayment = async () => {
    if (!loan || !selectedAccountId || !selectedAccount || paymentAmount <= 0) return;

    setIsLoading(true);
    try {
      const isCrossCurrency = selectedAccount.currency !== loan.currency;
      const sourceAmount = isCrossCurrency ? convertedAmount / conversionRate : paymentAmount;
      const available = selectedAccount.currentBalance ?? selectedAccount.balance ?? 0;
      if (selectedAccount.type !== 'credit' && available < sourceAmount) {
        setIsLoading(false);
        toast({
          title: 'Insufficient funds',
          description: `This account has ${formatCurrencyWithSign(available, selectedAccount.currency)} available.`,
          variant: 'destructive'
        });
        return;
      }
      
      // Create the loan payment transaction in account's currency
      let transactionAmount;
      if (selectedAccount.type === 'credit') {
        transactionAmount = sourceAmount;
      } else {
        transactionAmount = -sourceAmount;
      }

      await transactionService.create({
        description: `Loan payment: ${loan.name}`,
        amount: transactionAmount,
        type: 'loan_payment',
        date: paymentDate.toISOString().split('T')[0],
        category: 'Loans',
        accountId: selectedAccountId,
        currency: selectedAccount.currency,
        ...(isCrossCurrency && {
          fxRate: conversionRate,
          fxFrom: selectedAccount.currency,
          fxTo: loan.currency,
          convertedAmount: paymentAmount
        })
      });

      // Update account balance with source amount
      await updateAccountBalance(selectedAccountId, sourceAmount);

      // Create loan payment record in loan's currency
      await transactionService.create({
        description: `Loan payment: ${loan.name}`,
        amount: -paymentAmount,
        type: 'loan_payment',
        date: paymentDate.toISOString().split('T')[0],
        category: 'Loans',
        loanId: loan.id,
        currency: loan.currency,
        ...(isCrossCurrency && {
          fxRate: conversionRate,
          fxFrom: selectedAccount.currency,
          fxTo: loan.currency
        })
      });

      await onMakePayment(
        loan.id,
        selectedAccountId,
        paymentAmount,
        paymentDate.toISOString().split('T')[0]
      );
      
      onClose();
    } catch (error) {
      console.error('Error making loan payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!loan) return null;

  const showCurrencyConverter = selectedAccount && selectedAccount.currency !== loan.currency;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Make Payment - {loan.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Payment Amount ({loan.currency})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              placeholder={`Suggested: ${formatCurrencyWithSign(loan.paymentAmount || 0, loan.currency)}`}
            />
          </div>
          
          <div>
            <Label htmlFor="date">Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="account">From Account</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency}) - {formatCurrencyWithSign(account.currentBalance || account.balance, account.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showCurrencyConverter && (
            <CurrencyConverter
              fromCurrency={loan.currency}
              toCurrency={selectedAccount.currency}
              amount={paymentAmount}
              onRateChange={setConversionRate}
              onConvertedAmountChange={setConvertedAmount}
            />
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleMakePayment} 
              disabled={!selectedAccountId || paymentAmount <= 0 || isLoading}
            >
              {isLoading ? 'Processing...' : 'Make Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoanPaymentModal;
