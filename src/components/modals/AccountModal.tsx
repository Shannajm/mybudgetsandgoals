import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AccountForm from '@/components/forms/AccountForm';
import { Account, CreateAccountData } from '@/services/AccountService';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
  onSubmit: (data: CreateAccountData) => Promise<void>;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, account, onSubmit }) => {
  const handleSubmit = async (data: CreateAccountData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {account ? 'Edit Account' : 'Add New Account'}
          </DialogTitle>
        </DialogHeader>
        <AccountForm
          account={account}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AccountModal;
