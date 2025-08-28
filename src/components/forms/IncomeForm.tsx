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
import { useToast } from '@/hooks/use-toast';
import { Income, incomeService } from '@/services/IncomeService';
import { accountService } from '@/services/AccountService';

interface IncomeFormProps {
  income?: Income;
  onSave: (income: Income) => void;
  onCancel: () => void;
}

const IncomeForm: React.FC<IncomeFormProps> = ({ income, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    sourceName: '',
    amount: '',
    frequency: 'Monthly' as Income['frequency'],
    nextPaymentDate: new Date(),
    accountId: '',
    description: ''
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAccounts();
    if (income) {
      setFormData({
        sourceName: income.sourceName,
        amount: income.amount.toString(),
        frequency: income.frequency,
        nextPaymentDate: new Date(income.nextPaymentDate),
        accountId: income.accountId,
        description: income.description || ''
      });
    }
  }, [income]);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const incomeData = {
        sourceName: formData.sourceName,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        nextPaymentDate: formData.nextPaymentDate.toISOString().split('T')[0],
        accountId: formData.accountId,
        description: formData.description
      };

      let savedIncome: Income;
      if (income) {
        savedIncome = await incomeService.updateIncome({ ...income, ...incomeData });
        toast({
          title: 'Success',
          description: 'Income updated successfully'
        });
      } else {
        savedIncome = await incomeService.createIncome(incomeData);
        toast({
          title: 'Success',
          description: 'Income created successfully'
        });
      }

      onSave(savedIncome);
    } catch (error) {
      console.error('Error saving income:', error);
      toast({
        title: 'Error',
        description: 'Failed to save income. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{income ? 'Edit Income' : 'Add Income'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="sourceName">Source Name</Label>
            <Input
              id="sourceName"
              value={formData.sourceName}
              onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value as Income['frequency'] })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="One-time">One-time</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Next Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.nextPaymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.nextPaymentDate ? format(formData.nextPaymentDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.nextPaymentDate}
                  onSelect={(date) => date && setFormData({ ...formData, nextPaymentDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="accountId">Account</Label>
            <Select value={formData.accountId} onValueChange={(value) => setFormData({ ...formData, accountId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? 'Saving...' : 'Save'}
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

export default IncomeForm;