import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, AlertCircle, X } from 'lucide-react';
import { Account, CreateAccountData, accountService } from '@/services/AccountService';
import AccountModal from '@/components/modals/AccountModal';
import AccountCard from '@/components/AccountCard';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';
import { formatCurrency } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'react-router-dom';
import AccountQuickSheet from "@/components/accounts/AccountQuickSheet"; // <-- ADD THIS IMPORT

const Accounts: React.FC = () => {
  const { accountsVersion, reloadAll } = useAppContext();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [quick, setQuick] = useState<any | null>(null); // <-- ADD THIS STATE

  useEffect(() => {
    loadAccounts();
  }, [accountsVersion]);

  useEffect(() => {
    if (searchParams.get('add') === '1') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (data: CreateAccountData) => {
    try {
      await accountService.create(data);
      await loadAccounts();
      toast({
        title: 'Success',
        description: 'Account created successfully'
      });
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to create account',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateAccount = async (data: CreateAccountData) => {
    if (!editingAccount) return;
    try {
      await accountService.update(editingAccount.id, data);
      await loadAccounts();
      toast({
        title: 'Success',
        description: 'Account updated successfully'
      });
    } catch (error) {
      console.error('Error updating account:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await accountService.deleteWithTransactions(id); // or accountService.delete(id)
      await loadAccounts();
      toast({
        title: 'Success',
        description: 'Account deleted successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    setDeleteLoading(true);
    try {
      await accountService.deleteWithTransactions(accountToDelete.id);
      await loadAccounts();
      reloadAll();
      toast({
        title: 'Success',
        description: `Account "${accountToDelete.name}" deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete account',
        variant: 'destructive'
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(undefined);
  };

  const calculateTotalsByCurrency = () => {
    const totals: Record<string, { assets: number; liabilities: number }> = {};
    
    accounts.forEach(acc => {
      if (!totals[acc.currency]) {
        totals[acc.currency] = { assets: 0, liabilities: 0 };
      }
      
      const balance = acc.currentBalance || acc.balance;
      if (acc.type === 'credit') {
        if (balance > 0) {
          totals[acc.currency].liabilities += balance;
        } else {
          totals[acc.currency].assets += Math.abs(balance);
        }
      } else {
        totals[acc.currency].assets += balance;
      }
    });
    
    return totals;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounts</h1>
        </div>
        <div className="text-center py-8">Loading accounts...</div>
      </div>
    );
  }

  const totalsByCurrency = calculateTotalsByCurrency();
  const currencies = Object.keys(totalsByCurrency);
  const singleCurrency = currencies.length === 1;
  const hasSeedData = accounts.some(acc => acc.is_seed);

  return (
    <div className="p-6 space-y-6">
      {hasSeedData && showWelcomeBanner && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-orange-800 dark:text-orange-200">
              Welcome! These are example records—please delete them to start with a clean slate, then add your own.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcomeBanner(false)}
              className="text-orange-600 hover:text-orange-800 p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Accounts
        </h1>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="rounded-xl border p-4 hover:bg-muted/50 cursor-pointer"
            onClick={() => setQuick(account)} // <-- OPEN QUICK SHEET ON CLICK
          >
            <AccountCard
              account={account}
              onClick={() => setQuick(account)}
              onDelete={handleDeleteClick}
            />
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currencies.map(currency => (
              <div key={currency} className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="font-medium">Total Assets ({currency})</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(totalsByCurrency[currency].assets, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="font-medium">Total Liabilities ({currency})</span>
                  <span className="text-xl font-bold text-red-600">
                    {formatCurrency(totalsByCurrency[currency].liabilities, currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <span className="font-medium text-lg">
                    Net Worth {singleCurrency ? '' : `(${currency})`}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      totalsByCurrency[currency].assets - totalsByCurrency[currency].liabilities,
                      currency
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AccountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        account={editingAccount}
        onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount}
      />

      <DeleteAccountDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setAccountToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        account={accountToDelete}
        loading={deleteLoading}
      />

      <AccountQuickSheet
        open={!!quick}
        onOpenChange={(v) => !v && setQuick(null)}
        account={quick}
        onEdit={(a) => {
          setQuick(null);
          handleEdit(a); // your existing edit opener
        }}
        onDelete={handleDeleteAccount}
      />
    </div>
  );
};

export default Accounts;
