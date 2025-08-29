import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { Goal, goalService } from '@/services/GoalService';
import { Account, accountService } from '@/services/AccountService';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GoalFormProps {
  goal?: Goal;
  onSave: (goal: Goal) => void;
  onCancel: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ goal, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentSaved: 0,
    targetDate: new Date(),
    category: '',
    description: '',
    accountId: ''
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackingMode, setTrackingMode] = useState<'account' | 'manual'>('account');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        currentSaved: goal.currentSaved || 0,
        targetDate: new Date(goal.targetDate),
        category: goal.category,
        description: goal.description || '',
        accountId: goal.accountId || ''
      });
      setTrackingMode(goal.accountId ? 'account' : 'manual');
    }
  }, [goal]);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    setFormData({
      ...formData,
      accountId,
      currentSaved: account ? account.currentBalance || 0 : 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const goalData = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentSaved: formData.currentSaved,
        targetDate: formData.targetDate.toISOString().split('T')[0],
        category: formData.category,
        description: formData.description,
        accountId: trackingMode === 'account' ? formData.accountId : undefined
      };

      let savedGoal: Goal;
      if (goal) {
        savedGoal = await goalService.update(goal.id, goalData);
      } else {
        savedGoal = await goalService.create(goalData);
      }

      onSave(savedGoal);
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find(a => a.id === formData.accountId);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{goal ? 'Edit Goal' : 'Add Goal'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Label>Tracking Method</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  Link account: uses the selected account's balance as your saved amount automatically.
                  Manual amount: enter and update the saved amount yourself.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="tracking" value="account" checked={trackingMode === 'account'} onChange={() => setTrackingMode('account')} />
                Link account (auto)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="tracking" value="manual" checked={trackingMode === 'manual'} onChange={() => setTrackingMode('manual')} />
                Manual amount
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="name">Goal Title</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>

          <div>
            <Label htmlFor="targetAmount">Target Amount</Label>
            <Input id="targetAmount" type="number" step="0.01" value={formData.targetAmount} onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })} required />
          </div>

          {trackingMode === 'account' ? (
            <>
              <div>
                <Label>Account</Label>
                <Select value={formData.accountId} onValueChange={handleAccountChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {formatCurrency(account.currentBalance || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Current saved will match the account's current balance.</p>
              </div>

              <div>
                <Label htmlFor="currentSaved">Current Saved</Label>
                <Input id="currentSaved" value={formatCurrency(formData.currentSaved)} readOnly className="bg-gray-50 dark:bg-gray-800" />
              </div>
            </>
          ) : (
            <div>
              <Label htmlFor="currentSavedManual">Current Saved (manual)</Label>
              <Input id="currentSavedManual" type="number" step="0.01" value={formData.currentSaved} onChange={(e) => setFormData({ ...formData, currentSaved: parseFloat(e.target.value) || 0 })} />
              <p className="text-xs text-gray-500 mt-1">Enter how much you have saved so far.</p>
            </div>
          )}

          <div>
            <Label>Target Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('w-full justify-start text-left font-normal', !formData.targetDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.targetDate ? format(formData.targetDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={formData.targetDate} onSelect={(date) => date && setFormData({ ...formData, targetDate: date })} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : 'Save'}
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

export default GoalForm;
