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
import { Transaction, CreateTransactionData, transactionService } from '@/services/TransactionService';
import { Category, categoryService } from '@/services/CategoryService';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import TransferForm from './TransferForm';
import CurrencyConverter from './CurrencyConverter';

interface TransactionFormProps {
  transaction?: Transaction;
  onSave: (transaction?: Transaction) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ transaction, onSave, onCancel }) => {
  const { accounts, refreshData } = useAppContext();
  const { toast } = useToast();
  const [formData, setFormData] = useState<CreateTransactionData>({
    description: '',
    amount: 0,
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    category: '',
    accountId: ''
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [targetCurrency, setTargetCurrency] = useState<string>('USD');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (transaction) {
      if (transaction.type === 'transfer') {
        setShowTransferForm(true);
        return;
      }
      
      setFormData({
        description: transaction.description,
        amount: Math.abs(transaction.amount),
        type: transaction.type as 'expense' | 'income' | 'transfer' | 'loan_payment',
        date: transaction.date,
        category: transaction.category,
        accountId: transaction.accountId || ''
      });
      setDate(new Date(transaction.date));
    }
  }, [transaction]);

  useEffect(() => {
    loadCategories();
  }, [formData.type]);

  useEffect(() => {
    if (formData.accountId) {
      const account = accounts.find(a => a.id === formData.accountId);
      setSelectedAccount(account || null);
    }
  }, [formData.accountId, accounts]);

  const loadCategories = async () => {
    try {
      const categoriesData = formData.type === 'transfer' 
        ? await categoryService.getAll()
        : await categoryService.getByType(formData.type);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!formData.accountId) {
        throw new Error('Please select an account');
      }
      
      const account = accounts.find(a => a.id === formData.accountId);
      if (!account) {
        throw new Error('Account not found');
      }

      const isCrossCurrency = account.currency !== targetCurrency;
      
      const transactionData = {
        ...formData,
        amount: formData.amount,
        date: format(date, 'yyyy-MM-dd'),
        currency: account.currency,
        ...(isCrossCurrency && {
          fxRate: conversionRate,
          fxFrom: account.currency,
          fxTo: targetCurrency,
          convertedAmount
        })
      };
      
      let result;
      if (transaction) {
        result = await transactionService.update(transaction.id, transactionData);
      } else {
        result = await transactionService.create(transactionData);
      }
      
      await refreshData();
      
      toast({
        title: 'Success',
        description: `Transaction ${transaction ? 'updated' : 'created'} successfully`,
      });
      
      onSave(result);
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError(error instanceof Error ? error.message : 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: 'expense' | 'income' | 'transfer') => {
    if (value === 'transfer') {
      setShowTransferForm(true);
    } else {
      setFormData({ ...formData, type: value, category: '' });
    }
  };

  if (showTransferForm) {
    return (
      <TransferForm
        onSave={() => onSave()}
        onCancel={onCancel}
      />
    );
  }

  const showCurrencyConverter = selectedAccount && selectedAccount.currency !== targetCurrency;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{transaction ? 'Edit Transaction' : 'Add Transaction'}</CardTitle>
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
            <Label htmlFor="type">Type</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => 
              setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="account">Account</Label>
            <Select 
              value={formData.accountId} 
              onValueChange={(value) => setFormData({ ...formData, accountId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showCurrencyConverter && (
            <CurrencyConverter
              fromCurrency={selectedAccount.currency}
              toCurrency={targetCurrency}
              amount={formData.amount}
              onRateChange={setConversionRate}
              onConvertedAmountChange={setConvertedAmount}
            />
          )}

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (transaction ? 'Update' : 'Create')}
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

export default TransactionForm;