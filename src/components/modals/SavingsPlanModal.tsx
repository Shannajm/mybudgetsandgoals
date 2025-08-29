import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { savingsPlanService, SavingsPlan, CreateSavingsPlanData } from '@/services/SavingsPlanService';
import { useAppContext } from '@/contexts/AppContext';

interface SavingsPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: SavingsPlan;
  onSaved?: (plan: SavingsPlan) => void;
}

const SavingsPlanModal: React.FC<SavingsPlanModalProps> = ({ isOpen, onClose, plan, onSaved }) => {
  const { accounts } = useAppContext();
  const [form, setForm] = useState<CreateSavingsPlanData>({
    name: '',
    type: 'partner',
    currency: 'USD',
    amountPerPeriod: 0,
    frequency: 'weekly',
    startDate: new Date().toISOString().split('T')[0],
    totalPeriods: 50,
    paymentsMade: 0,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = [...new Set(accounts.map(a => a.currency))][0];
    setForm(prev => ({ ...prev, currency: c || prev.currency }));
  }, [accounts]);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name,
        type: plan.type,
        currency: plan.currency,
        amountPerPeriod: plan.amountPerPeriod,
        frequency: plan.frequency,
        startDate: plan.startDate,
        totalPeriods: plan.totalPeriods,
        paymentsMade: plan.paymentsMade,
        notes: plan.notes || ''
      });
    }
  }, [plan]);

  const save = async () => {
    setSaving(true);
    try {
      let saved: SavingsPlan;
      if (plan) saved = await savingsPlanService.update(plan.id, form);
      else saved = await savingsPlanService.create(form);
      onSaved?.(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{plan ? 'Edit Savings Plan' : 'Add Savings Plan'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="fixed_deposit">Fixed Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[...new Set(accounts.map(a => a.currency))].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount per period</Label>
              <Input type="number" step="0.01" value={form.amountPerPeriod}
                onChange={e => setForm({ ...form, amountPerPeriod: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={form.frequency} onValueChange={(v: any) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Total periods</Label>
              <Input type="number" step="1" value={form.totalPeriods}
                onChange={e => setForm({ ...form, totalPeriods: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Payments made</Label>
              <Input type="number" step="1" value={form.paymentsMade ?? 0}
                onChange={e => setForm({ ...form, paymentsMade: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsPlanModal;

