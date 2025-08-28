import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BillForm from '@/components/forms/BillForm';
import { Bill } from '@/services/BillService';

interface BillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill?: Bill;
  onSave: (bill: Bill) => void;
}

const BillModal: React.FC<BillModalProps> = ({
  isOpen,
  onClose,
  bill,
  onSave
}) => {
  const handleSave = (savedBill: Bill) => {
    onSave(savedBill);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {bill ? 'Edit Bill' : 'Add Bill'}
          </DialogTitle>
        </DialogHeader>
        <BillForm
          bill={bill}
          onSave={handleSave}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export { BillModal };
export default BillModal;