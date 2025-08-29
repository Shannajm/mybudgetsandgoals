import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpDown } from 'lucide-react';
import { useSearchParams } from "react-router-dom";
import TransactionModal from '@/components/modals/TransactionModal';
import TransactionListItem from '@/components/TransactionListItem';
import TransactionFilter from '@/components/TransactionFilter';
import { Transaction, transactionService } from '@/services/TransactionService';
import { Account, accountService } from '@/services/AccountService';
import { useToast } from "@/hooks/use-toast";

const Transactions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setIsAddOpen(true);
    }
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setSelectedTypes([typeParam]);
    }
  }, [searchParams]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedTypes]);

  const loadData = async () => {
    try {
      const [transactionsData, accountsData] = await Promise.all([
        transactionService.getAll(),
        accountService.getAll()
      ]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    if (selectedTypes.length === 0) {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(transaction => 
        selectedTypes.includes(transaction.type)
      );
      setFilteredTransactions(filtered);
    }
  };

  const handleFilterChange = (types: string[]) => {
    setSelectedTypes(types);
  };

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = async () => {
    await loadData();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await transactionService.delete(id);
      await loadData();
      toast({ title: "Transaction deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Please try again." });
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const getAccountCurrency = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account?.currency || 'USD';
  };

  const prefill = useMemo(() => ({
    accountId: searchParams.get("accountId") || undefined,
    type: (searchParams.get("type") as any) || undefined,
    transferToId: searchParams.get("to") || undefined,
    category: searchParams.get("category") || undefined,
  }), [searchParams]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Transactions
        </h1>
        <div className="flex space-x-2">
          <TransactionFilter
            selectedTypes={selectedTypes}
            onFilterChange={handleFilterChange}
          />
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddTransaction}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowUpDown className="h-5 w-5 mr-2" />
            Recent Transactions
            {selectedTypes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({filteredTransactions.length} of {transactions.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  accountName={getAccountName(transaction.accountId)}
                  onEdit={handleEditTransaction}
                  onDelete={handleDelete}
                  getAccountName={getAccountName}
                  getAccountCurrency={getAccountCurrency}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                {selectedTypes.length > 0 
                  ? 'No transactions found for the selected filters.' 
                  : 'No transactions found.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setSearchParams({});
        }}
        prefill={prefill}
        onCreated={loadData}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={editingTransaction}
        onSave={handleSaveTransaction}
      />
    </div>
  );
};

export default Transactions;
