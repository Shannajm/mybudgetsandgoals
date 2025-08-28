import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Account, CreateAccountData } from '@/services/AccountService';
import { Loader2 } from 'lucide-react';
import { formatCurrencyWithSign } from '@/lib/utils';

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: CreateAccountData) => Promise<void>;
  onCancel: () => void;
}

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'JMD', label: 'JMD - Jamaican Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' }
];

const AccountForm: React.FC<AccountFormProps> = ({ account, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    type: 'checking',
    currency: 'USD',
    currentBalance: undefined,
    creditLimit: undefined,
    availableCredit: undefined,
    statementDate: undefined,
    statementDueDate: undefined,
    statementAmount: undefined
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        currency: account.currency,
        currentBalance: account.currentBalance,
        creditLimit: account.creditLimit,
        availableCredit: account.availableCredit,
        statementDate: account.statementDate,
        statementDueDate: account.statementDueDate,
        statementAmount: account.statementAmount
      });
    }
  }, [account]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.type === 'credit') {
      if (!formData.creditLimit || formData.creditLimit < 0) {
        newErrors.creditLimit = 'Credit limit must be ≥ 0';
      }
      if (formData.availableCredit !== undefined && formData.availableCredit < 0) {
        newErrors.availableCredit = 'Available credit must be ≥ 0';
      }
      if (formData.statementDate !== undefined && (formData.statementDate < 1 || formData.statementDate > 31)) {
        newErrors.statementDate = 'Statement date must be between 1-31';
      }
      if (formData.statementDueDate !== undefined && (formData.statementDueDate < 1 || formData.statementDueDate > 31)) {
        newErrors.statementDueDate = 'Due date must be between 1-31';
      }
      if (formData.statementAmount !== undefined && formData.statementAmount < 0) {
        newErrors.statementAmount = 'Statement balance must be ≥ 0';
      }
    } else {
      if (formData.currentBalance !== undefined && formData.currentBalance < 0) {
        newErrors.currentBalance = 'Initial balance cannot be negative';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error saving account:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = formData.type === 'credit' && formData.creditLimit && formData.availableCredit !== undefined
    ? formData.creditLimit - formData.availableCredit
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter account name"
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
      </div>

      <div className="space-y-3">
        <Label>Account Type</Label>
        <RadioGroup
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value as any })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="checking" id="checking" />
            <Label htmlFor="checking">Checking</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="savings" id="savings" />
            <Label htmlFor="savings">Savings</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="credit" id="credit" />
            <Label htmlFor="credit">Credit</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((currency) => (
              <SelectItem key={currency.value} value={currency.value}>
                {currency.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(formData.type === 'checking' || formData.type === 'savings') && (
        <div className="space-y-2">
          <Label htmlFor="currentBalance">Initial Balance</Label>
          <Input
            id="currentBalance"
            type="number"
            min="0"
            step="0.01"
            value={formData.currentBalance || ''}
            onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || undefined })}
            placeholder="Enter initial balance"
            className={errors.currentBalance ? 'border-red-500' : ''}
          />
          {errors.currentBalance && <p className="text-sm text-red-500">{errors.currentBalance}</p>}
        </div>
      )}

      {formData.type === 'credit' && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">Credit Account Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                step="0.01"
                value={formData.creditLimit || ''}
                onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || undefined })}
                placeholder="Enter credit limit"
                className={errors.creditLimit ? 'border-red-500' : ''}
              />
              {errors.creditLimit && <p className="text-sm text-red-500">{errors.creditLimit}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="availableCredit">Available Credit</Label>
              <Input
                id="availableCredit"
                type="number"
                min="0"
                step="0.01"
                value={formData.availableCredit || ''}
                onChange={(e) => setFormData({ ...formData, availableCredit: parseFloat(e.target.value) || undefined })}
                placeholder="Enter available credit"
                className={errors.availableCredit ? 'border-red-500' : ''}
              />
              {errors.availableCredit && <p className="text-sm text-red-500">{errors.availableCredit}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Current Balance (Read-only)</Label>
            <div className={`p-2 bg-gray-100 dark:bg-gray-700 rounded border text-sm ${formatCurrencyWithSign(currentBalance, formData.currency).className}`}>
              {formatCurrencyWithSign(currentBalance, formData.currency).text}
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Statement Details (Optional)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statementDate">Statement Date</Label>
                <Select 
                  value={formData.statementDate?.toString() || ''} 
                  onValueChange={(value) => setFormData({ ...formData, statementDate: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger className={errors.statementDate ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Day of month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.statementDate && <p className="text-sm text-red-500">{errors.statementDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="statementDueDate">Due Date</Label>
                <Select 
                  value={formData.statementDueDate?.toString() || ''} 
                  onValueChange={(value) => setFormData({ ...formData, statementDueDate: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger className={errors.statementDueDate ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Day of month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.statementDueDate && <p className="text-sm text-red-500">{errors.statementDueDate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="statementAmount">Statement Balance</Label>
                <Input
                  id="statementAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.statementAmount || ''}
                  onChange={(e) => setFormData({ ...formData, statementAmount: parseFloat(e.target.value) || undefined })}
                  placeholder="Enter balance"
                  className={errors.statementAmount ? 'border-red-500' : ''}
                />
                {errors.statementAmount && <p className="text-sm text-red-500">{errors.statementAmount}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {account ? 'Update Account' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
};

export default AccountForm;