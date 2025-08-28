import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Account } from '@/services/AccountService';
import { formatCurrency } from '@/lib/utils';

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  account: Account | null;
  loading?: boolean;
}

const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  account,
  loading = false
}) => {
  if (!account) return null;

  const currentBalance = account.currentBalance ?? account.balance;
  const hasBalance = account.type === 'credit' ? currentBalance > 0 : currentBalance !== 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete the account <strong>"{account.name}"</strong>?
            </p>
            {hasBalance && (
              <p className="text-amber-600 font-medium">
                This account has a balance of {formatCurrency(Math.abs(currentBalance), account.currency)}.
              </p>
            )}
            <p className="text-red-600 font-medium">
              This action will permanently:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Remove the account from your account list</li>
              <li>Delete all transactions associated with this account</li>
              <li>Update your dashboard and account totals</li>
              <li>Remove this account from any transfers</li>
            </ul>
            <p className="text-red-600 font-medium">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? 'Deleting...' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAccountDialog;