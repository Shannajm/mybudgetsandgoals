import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loan, CreateLoanData, loanService } from '@/services/LoanService';
import { accountService, Account } from '@/services/AccountService';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface LoanFormProps {
  loan?: Loan;
  onSave: (loan: Loan) => void;
  onCancel: () => void;
}

const LoanForm: React.FC<LoanFormProps> = ({ loan, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CreateLoanData & { currency: string }>({
    name: '',
    principal: 0,
    interestRate: 0,
    paymentAmount: 0,
    paymentFrequency: 'monthly',
    nextDueDate: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadAccounts = async () => {
      const userAccounts = await accountService.getAll();
      setAccounts(userAccounts);
      const currencies = [...new Set(userAccounts.map(acc => acc.currency))];
      setAvailableCurrencies(currencies);
      
      // Only set default currency if no loan is being edited
      if (currencies.length > 0 && !loan) {
        setFormData(prev => ({ ...prev, currency: currencies[0] }));
      }
    };
    loadAccounts();
  }, [loan]);

  useEffect(() => {
    if (loan) {
      setFormData({
        name: loan.name,
        principal: loan.principal,
        interestRate: loan.interestRate,
        paymentAmount: loan.paymentAmount,
        paymentFrequency: loan.paymentFrequency,
        nextDueDate: loan.nextDueDate,
        currency: loan.currency || 'USD'
      });
    } else {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setFormData(prev => ({
        ...prev,
        nextDueDate: nextMonth.toISOString().split('T')[0]
      }));
    }
    setError('');
    setErrors({});
  }, [loan]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Loan name is required';
    }
    if (formData.principal <= 0) {
      newErrors.principal = 'Principal amount must be greater than 0';
    }
    if (formData.interestRate < 0) {
      newErrors.interestRate = 'Interest rate cannot be negative';
    }
    if (formData.paymentAmount <= 0) {
      newErrors.paymentAmount = 'Payment amount must be greater than 0';
    }
    if (!formData.nextDueDate) {
      newErrors.nextDueDate = 'Next due date is required';
    }
    if (!formData.currency) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let savedLoan: Loan;
      if (loan) {
        // For updates, pass the current balance along with other fields
        savedLoan = await loanService.update(loan.id, {
          ...formData,
          balance: loan.balance // Preserve current balance
        });
      } else {
        savedLoan = await loanService.create(formData);
        toast({
          title: 'Loan Created',
          description: `${savedLoan.name} has been created successfully.`,
        });
      }
      onSave(savedLoan);
    } catch (error) {
      console.error('Error saving loan:', error);
      setError(error instanceof Error ? error.message : 'Failed to save loan');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof (CreateLoanData & { currency: string }), value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCurrencyChange = (value: string) => {
    // Only update if the value is different from current
    if (value !== formData.currency) {
      handleInputChange('currency', value);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{loan ? 'Edit Loan' : 'Add New Loan'}</DialogTitle>
      </DialogHeader>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map(currency => (
                <SelectItem key={currency} value={currency}>{currency}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.currency && <p className="text-sm text-red-600">{errors.currency}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Loan Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Car Loan, Student Loan"
          />
          {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="principal">Principal Amount</Label>
          <Input
            id="principal"
            type="number"
            step="0.01"
            value={formData.principal}
            onChange={(e) => handleInputChange('principal', parseFloat(e.target.value) || 0)}
            placeholder={`${formatCurrency(25000, formData.currency)}`}
          />
          {errors.principal && <p className="text-sm text-red-600">{errors.principal}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestRate">Interest Rate (%)</Label>
          <Input
            id="interestRate"
            type="number"
            step="0.01"
            value={formData.interestRate}
            onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
            placeholder="4.50"
          />
          {errors.interestRate && <p className="text-sm text-red-600">{errors.interestRate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentAmount">Payment Amount</Label>
          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            value={formData.paymentAmount}
            onChange={(e) => handleInputChange('paymentAmount', parseFloat(e.target.value) || 0)}
            placeholder={`${formatCurrency(450, formData.currency)}`}
          />
          {errors.paymentAmount && <p className="text-sm text-red-600">{errors.paymentAmount}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentFrequency">Payment Frequency</Label>
          <Select value={formData.paymentFrequency} onValueChange={(value) => handleInputChange('paymentFrequency', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nextDueDate">Next Due Date</Label>
          <Input
            id="nextDueDate"
            type="date"
            value={formData.nextDueDate}
            onChange={(e) => handleInputChange('nextDueDate', e.target.value)}
          />
          {errors.nextDueDate && <p className="text-sm text-red-600">{errors.nextDueDate}</p>}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : loan ? 'Update Loan' : 'Add Loan'}
          </Button>
        </div>
      </form>
    </>
  );
};

export default LoanForm;