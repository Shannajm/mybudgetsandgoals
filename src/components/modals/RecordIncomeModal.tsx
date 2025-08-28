import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { Income } from '@/services/IncomeService';
import { transactionService } from '@/services/TransactionService';
import TransactionForm from '@/components/forms/TransactionForm';

interface RecordIncomeModalProps {
  income: Income;
  onClose: () => void;
}

const RecordIncomeModal: React.FC<RecordIncomeModalProps> = ({ income, onClose }) => {
  const { toast } = useToast();
  const { reloadAll } = useAppContext();
  const [loading, setLoading] = useState(false);

  // Create a full transaction object with all required fields
  const prefilledTransaction = {
    id: '',
    user_id: '',
    description: income.sourceName,
    amount: income.amount,
    type: 'income' as const,
    date: new Date().toISOString().split('T')[0],
    categoryId: 'Income',
    accountId: income.accountId,
    created_at: new Date().toISOString()
  };

  const handleSave = async (transaction?: any) => {
    try {
      setLoading(true);
      
      // Create the transaction with the data from the form
      await transactionService.create({
        description: transaction?.description || income.sourceName,
        amount: transaction?.amount || income.amount,
        type: 'income',
        date: transaction?.date || new Date().toISOString().split('T')[0],
        category: transaction?.category || 'Income',
        accountId: transaction?.accountId || income.accountId
      });

      // Reload all data to update balances and transaction list
      await reloadAll();
      
      toast({
        title: 'Success',
        description: 'Income recorded successfully'
      });
      
      onClose();
    } catch (error) {
      console.error('Error recording income:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record income',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Income: {income.sourceName}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TransactionForm
            transaction={prefilledTransaction}
            onSave={handleSave}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordIncomeModal;