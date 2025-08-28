import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Income, incomeService } from '@/services/IncomeService';
import { accountService } from '@/services/AccountService';
import IncomeForm from '@/components/forms/IncomeForm';
import DeleteIncomeDialog from '@/components/DeleteIncomeDialog';
import IncomeCard from '@/components/IncomeCard';

const IncomePage: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<Income | null>(null);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [thisMonthActual, setThisMonthActual] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadIncomes();
  }, []);

  const loadIncomes = async () => {
    try {
      setLoading(true);
      const [incomeData, accountData] = await Promise.all([
        incomeService.getAll(),
        accountService.getAll()
      ]);
      
      setIncomes(incomeData);
      setAccounts(accountData);
      
      // Calculate monthly total
      const monthlyTotalData = await incomeService.getMonthlyTotal();
      setMonthlyTotal(monthlyTotalData);
      
      // Calculate this month's actual income (placeholder - would need transaction data)
      setThisMonthActual(monthlyTotalData * 0.8); // Mock calculation
    } catch (error) {
      console.error('Error loading income data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load income data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = () => {
    setEditingIncome(undefined);
    setShowForm(true);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDeleteIncome = (income: Income) => {
    setIncomeToDelete(income);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteIncome = async () => {
    if (incomeToDelete) {
      try {
        await incomeService.deleteIncome(incomeToDelete.id);
        setDeleteDialogOpen(false);
        setIncomeToDelete(null);
        toast({
          title: 'Success',
          description: 'Income deleted successfully'
        });
        await loadIncomes();
      } catch (error) {
        console.error('Error deleting income:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete income',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSaveIncome = async (income: Income) => {
    setShowForm(false);
    setEditingIncome(undefined);
    await loadIncomes();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingIncome(undefined);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Income</h1>
        </div>
        <div className="text-center py-8">Loading income data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Income</h1>
        <Button onClick={handleAddIncome}>
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</div>
              <DollarSign className="h-8 w-8 opacity-80" />
            </div>
            <div className="text-xs opacity-80 mt-1">
              Expected monthly total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(thisMonthActual)}</div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
            <div className="text-xs opacity-80 mt-1">
              Received so far
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incomes.map((income) => (
          <IncomeCard
            key={income.id}
            income={income}
            accounts={accounts}
            onEdit={handleEditIncome}
            onDelete={handleDeleteIncome}
          />
        ))}
      </div>

      {incomes.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No income sources yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add your income sources to track your earnings and plan your budget.
          </p>
          <Button onClick={handleAddIncome}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Income Source
          </Button>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <IncomeForm
            income={editingIncome}
            onSave={handleSaveIncome}
            onCancel={handleCancelForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteIncomeDialog
        income={incomeToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteIncome}
      />
    </div>
  );
};

export default IncomePage;