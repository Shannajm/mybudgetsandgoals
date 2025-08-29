import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Account, accountService } from '@/services/AccountService';
import { transactionService } from '@/services/TransactionService';
import { fxService } from '@/services/FxService';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface TransferFormProps {
  onSave: () => void;
  onCancel: () => void;
  prefill?: {
    fromAccountId?: string;
    toAccountId?: string;
    description?: string;
  };
}

const TransferForm: React.FC<TransferFormProps> = ({ onSave, onCancel, prefill }) => {
  const { reloadAll } = useAppContext();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    fromAccountId: '',
    toAccountId: '',
    rate: 1
  });
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [rateLoading, setRateLoading] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  // Apply prefill when provided
  useEffect(() => {
    if (prefill?.fromAccountId || prefill?.toAccountId || prefill?.description) {
      setFormData(prev => ({
        ...prev,
        ...(prefill.fromAccountId ? { fromAccountId: prefill.fromAccountId } : {}),
        ...(prefill.toAccountId ? { toAccountId: prefill.toAccountId } : {}),
        ...(prefill.description ? { description: prefill.description } : {}),
      }));
    }
  }, [prefill]);

  useEffect(() => {
    if (formData.fromAccountId && formData.toAccountId) {
      loadExchangeRate();
    }
  }, [formData.fromAccountId, formData.toAccountId]);

  const loadAccounts = async () => {
    try {
      const accountsData = await accountService.getAll();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
    }
  };

  const loadExchangeRate = async () => {
    const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
    const toAccount = accounts.find(a => a.id === formData.toAccountId);
    
    if (!fromAccount || !toAccount) return;
    
    const fromCurrency = fromAccount.currency || 'USD';
    const toCurrency = toAccount.currency || 'USD';
    
    if (fromCurrency === toCurrency) {
      setFormData(prev => ({ ...prev, rate: 1 }));
      return;
    }
    
    setRateLoading(true);
    try {
      const rate = await fxService.getRate(fromCurrency, toCurrency);
      setFormData(prev => ({ ...prev, rate }));
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    } finally {
      setRateLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!formData.fromAccountId || !formData.toAccountId) {
        throw new Error('Please select both from and to accounts');
      }
      
      if (formData.fromAccountId === formData.toAccountId) {
        throw new Error('From and to accounts must be different');
      }
      
      const convertedAmount = formData.amount * formData.rate;
      
      await transactionService.createTransfer({
        fromId: formData.fromAccountId,
        toId: formData.toAccountId,
        amount: formData.amount,
        rate: formData.rate,
        description: formData.description,
        date: format(date, 'yyyy-MM-dd')
      });
      
      reloadAll();
      
      toast({
        title: 'Success',
        description: 'Transfer created successfully',
      });
      
      onSave();
    } catch (error) {
      console.error('Error creating transfer:', error);
      setError(error instanceof Error ? error.message : 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  const fromAccount = accounts.find(a => a.id === formData.fromAccountId);
  const toAccount = accounts.find(a => a.id === formData.toAccountId);
  const fromCurrency = fromAccount?.currency || 'USD';
  const toCurrency = toAccount?.currency || 'USD';
  const convertedAmount = formData.amount * formData.rate;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Transfer Funds</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Transfer description"
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="fromAccount">From Account {fromAccount && `(${fromCurrency})`}</Label>
            <Select 
              value={formData.fromAccountId} 
              onValueChange={(value) => setFormData({ ...formData, fromAccountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select from account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency || 'USD'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fromCurrency !== toCurrency && (
            <div>
              <Label htmlFor="rate">Conversion Rate {rateLoading && '(Loading...)'}</Label>
              <Input
                id="rate"
                type="number"
                step="0.0001"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 1 })}
                placeholder="Exchange rate"
              />
              <p className="text-sm text-gray-500 mt-1">
                1 {fromCurrency} = {fxService.formatRate(formData.rate)} {toCurrency}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="toAccount">To Account {toAccount && `(${toCurrency})`}</Label>
            <Select 
              value={formData.toAccountId} 
              onValueChange={(value) => setFormData({ ...formData, toAccountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select to account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency || 'USD'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.amount > 0 && formData.rate > 0 && fromCurrency !== toCurrency && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <p className="text-sm text-blue-700">
                Transfer: {fxService.formatExchangeDisplay(
                  formData.amount, 
                  convertedAmount, 
                  formData.rate, 
                  fromCurrency, 
                  toCurrency
                )}
              </p>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Transfer'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransferForm;
