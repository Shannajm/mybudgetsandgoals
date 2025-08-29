import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import BillModal from '@/components/modals/BillModal';
import PayBillModal from '@/components/modals/PayBillModal';
import StatCard from '@/components/StatCard';
import BillsList from '@/components/BillsList';
import { Bill, billService } from '@/services/BillService';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyWithSign } from '@/lib/utils';

const Bills: React.FC = () => {
  const { bills, accounts, loading, refreshData } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayBillModalOpen, setIsPayBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | undefined>();
  const [billToPay, setBillToPay] = useState<Bill | null>(null);
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
      toast({
        title: 'Success',
        description: 'Bill deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bill',
        variant: 'destructive'
      });
    }
  };

  const handleSaveBill = async () => {
    await refreshData();
  };

  

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
      // Only update the bill's schedule; the actual transaction is created in PayBillModal.
      const bill = bills.find(b => b.id === billId);
      if (!bill) throw new Error('Bill not found');

      const nextDueDate = calculateNextDueDate(bill.dueDate, bill.frequency);
      await billService.update(billId, { nextDueDate });

      await refreshData();

      toast({ title: 'Success', description: `Payment for ${bill.title} processed successfully` });
    } catch (error) {
      console.error('Error processing bill payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process bill payment',
        variant: 'destructive'
      });
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
  const aggregatesByCurrency = Object.entries(billsByCurrency).map(
    ([currency, billsForCurrency]) => {
      const totalThisWeek = billsForCurrency
        .filter(b => isDueWithin(b.dueDate, 7))
        .reduce((sum, b) => sum + b.amount, 0);
      const totalThisMonth = billsForCurrency
        .filter(b => isDueWithin(b.dueDate, 30))
        .reduce((sum, b) => sum + b.amount, 0);
      const monthlyTotal = billsForCurrency
        .filter(b => isInSameMonth(b.dueDate))
        .reduce((sum, b) => sum + b.amount, 0);

      return { currency, totalThisWeek, totalThisMonth, monthlyTotal, billsForCurrency };
    }
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading bills...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Bills & Recurring Payments
        </h1>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddBill}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bill
        </Button>
      </div>

      {aggregatesByCurrency.map(({ currency, totalThisWeek, totalThisMonth, monthlyTotal, billsForCurrency }) => (
        <section key={currency} className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Bills & Recurring Payments ({currency})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Due This Week"
              amount={formatCurrencyWithSign(totalThisWeek, currency)}
              variant={totalThisWeek > 0 ? 'alert' : 'normal'}
            />
            <StatCard
              label="Due This Month"
              amount={formatCurrencyWithSign(totalThisMonth, currency)}
              variant="warning"
            />
            <StatCard
              label="Monthly Total"
              amount={formatCurrencyWithSign(monthlyTotal, currency)}
              variant="info"
            />
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
        </section>
      ))}

      <BillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bill={editingBill}
        onSave={handleSaveBill}
      />

      {/* Loan payments are managed on the Loans page */}

      <PayBillModal
        isOpen={isPayBillModalOpen}
        onClose={() => setIsPayBillModalOpen(false)}
        bill={billToPay}
        onPayBill={handlePayBillSubmit}
      />
    </div>
  );
};

export default Bills;
