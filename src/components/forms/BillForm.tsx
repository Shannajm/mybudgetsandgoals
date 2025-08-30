import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bill, CreateBillData, billService } from '@/services/BillService';
import { Category, categoryService } from '@/services/CategoryService';
import AddCategoryDialog from '@/components/modals/AddCategoryDialog';
import { fxService } from '@/services/FxService';
import { useAppContext } from '@/contexts/AppContext';

interface BillFormProps {
  bill?: Bill;
  onSave: (bill: Bill) => void;
  onCancel: () => void;
}

const AVAILABLE_CURRENCIES = ['USD', 'JMD', 'EUR', 'GBP', 'CAD'];

const BillForm: React.FC<BillFormProps> = ({ bill, onSave, onCancel }) => {
  const { accounts, refreshData } = useAppContext();
  const [formData, setFormData] = useState<CreateBillData & { fxRate?: number; convertedAmount?: number }>({
    name: '',
    amount: 0,
    category: '',
    dueDate: new Date().toISOString().split('T')[0],
    frequency: 'monthly',
    accountId: '',
    currency: 'USD'
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [fxRate, setFxRate] = useState<number>(1);
  const [loadingRate, setLoadingRate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bill) {
      setFormData({
        name: bill.title,
        amount: bill.amount,
        category: bill.category,
        dueDate: bill.dueDate,
        frequency: bill.frequency,
        accountId: bill.accountId,
        currency: bill.currency || 'USD'
      });
      setDate(new Date(bill.dueDate));
    }
  }, [bill]);

  // Fetch FX rate when currencies differ
  useEffect(() => {
    const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
    if (selectedAccount && formData.currency && selectedAccount.currency !== formData.currency) {
      fetchExchangeRate(formData.currency, selectedAccount.currency);
    } else {
      setFxRate(1);
    }
  }, [formData.accountId, formData.currency, accounts]);

  const fetchExchangeRate = async (from: string, to: string) => {
    setLoadingRate(true);
    try {
      const rate = await fxService.getRate(from, to);
      setFxRate(rate);
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      setFxRate(1);
    } finally {
      setLoadingRate(false);
    }
  };

  const loadData = async () => {
    try {
      setDataLoading(true);
      setError('');
      
      const categoriesData = await categoryService.getByType('expense');
      setCategories(categoriesData);
      
      if (!bill && accounts.length > 0) {
        const defaultCurrency = accounts[0].currency || 'USD';
        setFormData(prev => ({ ...prev, currency: defaultCurrency }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load required data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    if (value === '__add__') {
      setShowAddCategory(true);
    } else {
      setFormData({ ...formData, category: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.accountId) {
      setError('Please select an account');
      return;
    }
    
    if (!formData.currency) {
      setError('Please select a currency');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
      const convertedAmount = selectedAccount?.currency !== formData.currency ? formData.amount * fxRate : formData.amount;
      
      const billData = {
        ...formData,
        dueDate: format(date, 'yyyy-MM-dd'),
        fxRate: selectedAccount?.currency !== formData.currency ? fxRate : undefined,
        convertedAmount: selectedAccount?.currency !== formData.currency ? convertedAmount : undefined
      };
      
      let result;
      if (bill) {
        result = await billService.update(bill.id, billData);
      } else {
        result = await billService.create(billData);
      }
      
      await refreshData();
      onSave(result);
    } catch (error) {
      console.error('Error saving bill:', error);
      setError('Failed to save bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmountDisplay = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const selectedAccount = accounts.find(acc => acc.id === formData.accountId);
  const showConversion = selectedAccount && selectedAccount.currency !== formData.currency;
  const convertedAmount = showConversion ? formData.amount * fxRate : formData.amount;

  if (dataLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button onClick={loadData} className="ml-2" size="sm">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{bill ? 'Edit Bill' : 'Add Bill'}</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={formData.currency} onValueChange={(value) => 
              setFormData({ ...formData, currency: value })}>  
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount ({formatAmountDisplay(formData.amount)})</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value >= 0) {
                  setFormData({ ...formData, amount: value });
                }
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__add__" className="text-blue-600">+ Add new category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Due Date</Label>
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
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={formData.frequency} onValueChange={(value: 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => 
              setFormData({ ...formData, frequency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="account">Account</Label>
            <Select value={formData.accountId} onValueChange={(value) => 
              setFormData({ ...formData, accountId: value })}>
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

          {showConversion && (
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label htmlFor="fxRate">Conversion Rate ({formData.currency} → {selectedAccount.currency})</Label>
              <Input
                id="fxRate"
                type="number"
                step="0.0001"
                min="0"
                value={fxRate}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value > 0) {
                    setFxRate(value);
                  }
                }}
                disabled={loadingRate}
              />
              <div className="text-sm text-muted-foreground">
                Charge {formatAmountDisplay(formData.amount)} × {fxRate.toFixed(4)} = {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: selectedAccount.currency,
                  minimumFractionDigits: 2
                }).format(convertedAmount)}
              </div>
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : (bill ? 'Update' : 'Create')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
      <AddCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        defaultType={'expense'}
        onCreated={(c) => {
          setCategories((prev) => {
            if (prev.some(p => p.name.toLowerCase() === c.name.toLowerCase())) return prev;
            return [...prev, c];
          });
          setFormData({ ...formData, category: c.name });
        }}
      />
    </Card>
  );
};

export default BillForm;
