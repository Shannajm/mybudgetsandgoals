import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SavingsPlan, savingsPlanService } from '@/services/SavingsPlanService';
import { useAppContext } from '@/contexts/AppContext';
import { Account } from '@/services/AccountService';
import CurrencyConverter from '@/components/forms/CurrencyConverter';
import { transactionService } from '@/services/TransactionService';
import { format } from 'date-fns';
import { formatCurrencyWithSign } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plan: SavingsPlan | null;
  onDone?: () => void;
}

const ContributePlanModal: React.FC<Props> = ({ open, onOpenChange, plan, onDone }) => {
  const { accounts, refreshData } = useAppContext();
  const [accountId, setAccountId] = useState('');
  const [periods, setPeriods] = useState(1);
  const [date, setDate] = useState<Date>(new Date());
  const [rate, setRate] = useState(1);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const selectedAccount: Account | undefined = useMemo(
    () => accounts.find(a => a.id === accountId),
    [accounts, accountId]
  );

  useEffect(() => {
    if (open) {
      setAccountId('');
      setPeriods(1);
      setDate(new Date());
      setRate(1);
      setConvertedAmount(0);
    }
  }, [open]);

  useEffect(() => {
    if (plan) setConvertedAmount(plan.amountPerPeriod * periods);
  }, [plan, periods]);

  if (!plan) return null;

  const isCross = !!selectedAccount && selectedAccount.currency !== plan.currency;
  const planAmount = plan.amountPerPeriod * periods; // in plan currency
  const accountAmount = isCross ? planAmount * rate : planAmount; // in account currency

  const handleSubmit = async () => {
    if (!selectedAccount) return;
    setIsLoading(true);
    try {
      const txAmount = selectedAccount.type === 'credit' ? Math.abs(accountAmount) : -Math.abs(accountAmount);
      await transactionService.create({
        description: `Savings contribution: ${plan.name}`,
        amount: txAmount,
        type: 'bill_payment', // treat as outflow; positive for credit when we set above
        date: format(date, 'yyyy-MM-dd'),
        category: 'Savings Plan',
        accountId: selectedAccount.id,
        currency: selectedAccount.currency,
        ...(isCross && { fxRate: rate, fxFrom: selectedAccount.currency, fxTo: plan.currency, convertedAmount: planAmount })
      });

      await savingsPlanService.applyContribution(plan.id, periods, format(date, 'yyyy-MM-dd'));
      await refreshData();
      onDone?.();
      onOpenChange(false);
    } catch (e) {
      console.error('Error contributing to plan:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Contribute to {plan.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Periods to pay</Label>
              <Input type="number" min={1} step={1} value={periods} onChange={e => setPeriods(Math.max(1, parseInt(e.target.value) || 1))} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={format(date, 'yyyy-MM-dd')} onChange={e => setDate(new Date(e.target.value))} />
            </div>
          </div>

          <div>
            <Label>From Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.currency}) — {formatCurrencyWithSign(a.currentBalance ?? a.balance, a.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAccount && selectedAccount.currency !== plan.currency && (
            <CurrencyConverter
              fromCurrency={plan.currency}
              toCurrency={selectedAccount.currency}
              amount={plan.amountPerPeriod * periods}
              onRateChange={setRate}
              onConvertedAmountChange={setConvertedAmount}
            />
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!accountId || isLoading}>{isLoading ? 'Processing...' : 'Contribute'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContributePlanModal;

