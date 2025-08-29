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
import { Bill } from '@/services/BillService';
import { Account } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { formatCurrencyWithSign } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import CurrencyConverter from '../forms/CurrencyConverter';

interface PayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onPayBill: (billId: string, accountId: string, amount: number, date: string) => Promise<void>;
}

const PayBillModal: React.FC<PayBillModalProps> = ({
  isOpen,
  onClose,
  bill,
  onPayBill
}) => {
  const { accounts, refreshData } = useAppContext();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setSelectedAccountId('');
      setPaymentDate(new Date());
      setSelectedAccount(null);
      setConversionRate(1);
      setConvertedAmount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      setSelectedAccount(account || null);
    }
  }, [selectedAccountId, accounts]);

  useEffect(() => {
    if (bill) {
      setConvertedAmount(bill.amount);
    }
  }, [bill]);

  const handlePay = async () => {
    if (!bill || !selectedAccountId || !selectedAccount) return;

    setIsLoading(true);
    try {
      const isCrossCurrency = selectedAccount.currency !== bill.currency;
      // Use the amount in the selected account's currency.
      // `convertedAmount` already equals bill.amount * conversionRate (from -> to)
      // so when paying from a different-currency account we should post that converted number.
      const sourceAmount = isCrossCurrency ? convertedAmount : bill.amount;
      
      // Create the bill payment transaction in account's currency
      let transactionAmount;
      if (selectedAccount.type === 'credit') {
        transactionAmount = sourceAmount;
      } else {
        transactionAmount = -sourceAmount;
      }

      await transactionService.create({
        description: `Bill payment: ${bill.title}`,
        amount: transactionAmount, // negative for checking/savings, positive for credit
        type: 'bill_payment',
        date: paymentDate.toISOString().split('T')[0],
        category: 'Bills',
        accountId: selectedAccountId,
        currency: selectedAccount.currency,
        ...(isCrossCurrency && { fxRate: conversionRate, fxFrom: selectedAccount.currency, fxTo: bill.currency, convertedAmount: bill.amount })
      });

      await onPayBill(
        bill.id,
        selectedAccountId,
        bill.amount,
        paymentDate.toISOString().split('T')[0]
      );
      
      await refreshData();
      onClose();
    } catch (error) {
      console.error('Error paying bill:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!bill) return null;

  const showCurrencyConverter = selectedAccount && selectedAccount.currency !== bill.currency;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pay {bill.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Bill Amount</Label>
            <Input
              id="amount"
              value={formatCurrencyWithSign(bill.amount, bill.currency)}
              readOnly
              className="bg-gray-50 dark:bg-gray-800"
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
              fromCurrency={bill.currency}
              toCurrency={selectedAccount.currency}
              amount={bill.amount}
              onRateChange={setConversionRate}
              onConvertedAmountChange={setConvertedAmount}
            />
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handlePay} 
              disabled={!selectedAccountId || isLoading}
            >
              {isLoading ? 'Processing...' : 'Pay'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayBillModal;
