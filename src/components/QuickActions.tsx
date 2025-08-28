import React, { useState } from 'react';
import { Plus, ArrowLeftRight, Receipt, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { TransactionModal } from '@/components/modals/TransactionModal';
import { BillModal } from '@/components/modals/BillModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import TransferForm from '@/components/forms/TransferForm';
import GoalForm from '@/components/forms/GoalForm';

const QuickActions: React.FC = () => {
  const isMobile = useIsMobile();
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const handleSave = () => {
    // Refresh data after save
    window.location.reload();
  };

  if (isMobile) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setTransactionModalOpen(true)}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
        <TransactionModal
          isOpen={transactionModalOpen}
          onClose={() => setTransactionModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => setTransactionModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
        
        <Button
          onClick={() => setBillModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Receipt className="h-4 w-4" />
          Add Bill
        </Button>
        
        <Button
          onClick={() => setGoalModalOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Target className="h-4 w-4" />
          Add Goal
        </Button>
        
        <Button
          onClick={() => setTransferModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <ArrowLeftRight className="h-4 w-4" />
          Transfer Funds
        </Button>
      </div>

      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        onSave={handleSave}
      />
      
      <BillModal
        isOpen={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        onSave={handleSave}
      />
      
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Funds</DialogTitle>
          </DialogHeader>
          <TransferForm
            onSave={() => {
              handleSave();
              setTransferModalOpen(false);
            }}
            onCancel={() => setTransferModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Goal</DialogTitle>
          </DialogHeader>
          <GoalForm
            onSave={() => {
              handleSave();
              setGoalModalOpen(false);
            }}
            onCancel={() => setGoalModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickActions;