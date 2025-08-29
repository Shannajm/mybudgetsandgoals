import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TransactionForm from '@/components/forms/TransactionForm';
import { Transaction } from '@/services/TransactionService';

type Prefill = {
  accountId?: string;
  type?: 'income' | 'expense' | 'transfer';
  transferToId?: string;
  category?: string;
};

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
  onSave?: () => void;
  onCreated?: () => void;
  prefill?: Prefill;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  onCreated,
  prefill,
}) => {
  const handleSave = () => {
    // Call whichever callbacks were provided, then close.
    onSave?.();
    onCreated?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
        </DialogHeader>
        <TransactionForm
          transaction={transaction}
          prefill={prefill}
          onSave={handleSave}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TransactionModal;
export { TransactionModal };
