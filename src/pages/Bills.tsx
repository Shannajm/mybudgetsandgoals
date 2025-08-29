import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BillModal from '@/components/modals/BillModal';
import PayBillModal from '@/components/modals/PayBillModal';
import StatCard from '@/components/StatCard';
import BillsList from '@/components/BillsList';
import { Bill, billService } from '@/services/BillService';
import { savingsPlanService, SavingsPlan } from '@/services/SavingsPlanService';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyWithSign } from '@/lib/utils';
import ContributePlanModal from '@/components/modals/ContributePlanModal';
import InfoTip from '@/components/InfoTip';

const Bills: React.FC = () => {
  const { bills, accounts, loading, refreshData } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayBillModalOpen, setIsPayBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | undefined>();
  const [billToPay, setBillToPay] = useState<Bill | null>(null);
  const [savingsPlans, setSavingsPlans] = useState<SavingsPlan[]>([]);
  const [contribPlan, setContribPlan] = useState<SavingsPlan | null>(null);
  const { toast } = useToast();

  const handleAddBill = () => {
    setEditingBill(undefined);
    setIsModalOpen(true);
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setIsModalOpen(true);
  };

  const handlePayBill = (bill: Bill) => {
    setBillToPay(bill);
    setIsPayBillModalOpen(true);
  };

  const handleDeleteBill = async (bill: Bill) => {
    if (bill.source === 'loan') {
      toast({
        title: 'Cannot Delete',
        description: 'Loan payments cannot be deleted from the Bills page. Manage them from the Loans page.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await billService.delete(bill.id);
      await refreshData();
      toast({ title: 'Success', description: 'Bill deleted successfully' });
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({ title: 'Error', description: 'Failed to delete bill', variant: 'destructive' });
    }
  };

  const handleSaveBill = async () => {
    await refreshData();
  };

  // Load Fixed Savings (for reminders)
  const loadSavings = async () => {
    try {
      const plans = await savingsPlanService.getAll();
      setSavingsPlans(plans);
    } catch (e) {
      console.error('Error loading savings plans:', e);
    }
  };

  useEffect(() => { loadSavings(); }, []);

  const calculateNextDueDate = (currentDueDate: string, frequency: string): string => {
    const date = new Date(currentDueDate);
    switch (frequency) {
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return currentDueDate;
    }
    return date.toISOString().split('T')[0];
  };

  const handlePayBillSubmit = async (billId: string, accountId: string, amount: number, date: string) => {
    try {
      const bill = bills.find(b => b.id === billId);
      if (!bill) throw new Error('Bill not found');
      const nextDueDate = calculateNextDueDate(bill.dueDate, bill.frequency);
      await billService.update(billId, { nextDueDate });
      await refreshData();
      toast({ title: 'Success', description: `Payment for ${bill.title} processed successfully` });
    } catch (error) {
      console.error('Error processing bill payment:', error);
      toast({ title: 'Error', description: 'Failed to process bill payment', variant: 'destructive' });
      throw error;
    }
  };

  const getAccountName = (accountId: string) => {
    if (!accountId) return 'No Account';
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const getAccountCurrency = (accountId: string) => {
    if (!accountId) return 'USD';
    const account = accounts.find(acc => acc.id === accountId);
    return account?.currency || 'USD';
  };

  const isDueWithin = (dueDate: string, days: number) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= days;
  };

  const isInSameMonth = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear();
  };

  // Group bills by currency
  const billsByCurrency = bills.reduce((map, bill) => {
    const currency = bill.currency || 'USD';
    (map[currency] ||= []).push(bill);
    return map;
  }, {} as Record<string, Bill[]>);

  // For each currency, compute aggregates
  const aggregatesByCurrency = Object.entries(billsByCurrency).map(([currency, billsForCurrency]) => {
    const totalThisWeek = billsForCurrency.filter(b => isDueWithin(b.dueDate, 7)).reduce((sum, b) => sum + b.amount, 0);
    const totalThisMonth = billsForCurrency.filter(b => isDueWithin(b.dueDate, 30)).reduce((sum, b) => sum + b.amount, 0);
    const monthlyTotal = billsForCurrency.filter(b => isInSameMonth(b.dueDate)).reduce((sum, b) => sum + b.amount, 0);
    return { currency, totalThisWeek, totalThisMonth, monthlyTotal, billsForCurrency };
  });

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading bills...</div>
        </div>
      </div>
    );
  }

  // Group savings plans for reminders
  const savingsByCurrency = savingsPlans.reduce((map, p) => {
    (map[p.currency] ||= []).push(p);
    return map;
  }, {} as Record<string, SavingsPlan[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bills & Recurring Payments</h1>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddBill}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bill
        </Button>
      </div>

      {aggregatesByCurrency.map(({ currency, totalThisWeek, totalThisMonth, monthlyTotal, billsForCurrency }) => (
        <section key={currency} className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Bills & Recurring Payments ({currency})</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Due This Week" amount={formatCurrencyWithSign(totalThisWeek, currency)} variant={totalThisWeek > 0 ? 'alert' : 'normal'} />
            <StatCard label="Due This Month" amount={formatCurrencyWithSign(totalThisMonth, currency)} variant="warning" />
            <StatCard label="Monthly Total" amount={formatCurrencyWithSign(monthlyTotal, currency)} variant="info" />
          </div>

          <BillsList
            bills={billsForCurrency}
            currency={currency}
            onEditBill={handleEditBill}
            onDeleteBill={handleDeleteBill}
            onPayBill={handlePayBill}
            getAccountName={getAccountName}
            getAccountCurrency={getAccountCurrency}
          />

          {(savingsByCurrency[currency]?.length || 0) > 0 && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 flex items-center gap-2">
                Fixed Savings Reminders ({currency})
                <InfoTip text="Shows plans with a next due within 14 days." />
              </h3>
              <div className="space-y-2">
                {savingsByCurrency[currency]
                  .filter(p => isDueWithin(p.nextDueDate, 14))
                  .map(p => (
                    <div key={p.id} className="p-4 rounded-lg border bg-white dark:bg-gray-900 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-sm text-gray-600">Next due {new Date(p.nextDueDate).toLocaleDateString()} - Amount {formatCurrencyWithSign(p.amountPerPeriod, p.currency)}</div>
                      </div>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => setContribPlan(p)}>Contribute</Button>
                    </div>
                  ))}
                {!(savingsByCurrency[currency]?.some(p => isDueWithin(p.nextDueDate, 14))) && (
                  <div className="text-sm text-gray-500">No fixed savings due soon.</div>
                )}
              </div>
            </div>
          )}
        </section>
      ))}

      <BillModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} bill={editingBill} onSave={handleSaveBill} />
      <PayBillModal isOpen={isPayBillModalOpen} onClose={() => setIsPayBillModalOpen(false)} bill={billToPay} onPayBill={handlePayBillSubmit} />
      <ContributePlanModal
        open={!!contribPlan}
        onOpenChange={(v) => { if (!v) setContribPlan(null); }}
        plan={contribPlan}
        onDone={async () => { await loadSavings(); }}
      />
    </div>
  );
};

export default Bills;
