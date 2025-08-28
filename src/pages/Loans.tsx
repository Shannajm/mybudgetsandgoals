import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { Loan, loanService } from '@/services/LoanService';
import LoanForm from '@/components/forms/LoanForm';
import LoanCard from '@/components/LoanCard';
import LoanPaymentModal from '@/components/modals/LoanPaymentModal';
import DeleteLoanDialog from '@/components/DeleteLoanDialog';
import { useToast } from '@/hooks/use-toast';

const LoansPage: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>(undefined);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [highlightedLoanId, setHighlightedLoanId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const data = await loanService.getAll();
      setLoans(data);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLoan = () => {
    setEditingLoan(undefined);
    setShowForm(true);
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setShowForm(true);
  };

  const handleDeleteLoan = (loan: Loan) => {
    setLoanToDelete(loan);
    setDeleteDialogOpen(true);
  };

  const handleMakePayment = (loan: Loan) => {
    setSelectedLoanForPayment(loan);
    setPaymentModalOpen(true);
  };

  const confirmDeleteLoan = async () => {
    if (loanToDelete) {
      try {
        await loanService.delete(loanToDelete.id);
        setDeleteDialogOpen(false);
        setLoanToDelete(null);
        await loadLoans();
      } catch (error) {
        console.error('Error deleting loan:', error);
      }
    }
  };

  const handleSaveLoan = async (loan: Loan) => {
    setShowForm(false);
    setEditingLoan(undefined);
    
    // Show toast and highlight the updated loan
    if (editingLoan) {
      toast({
        title: 'Loan Updated',
        description: `${loan.name} has been updated successfully.`,
      });
      
      // Highlight the updated loan card
      setHighlightedLoanId(loan.id);
      setTimeout(() => setHighlightedLoanId(null), 3000);
    }
    
    await loadLoans();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingLoan(undefined);
  };

  const handlePaymentMade = async () => {
    await loadLoans();
  };

  const totalBalance = loans.reduce((sum, loan) => sum + loan.balance, 0);
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalPaid = totalPrincipal - totalBalance;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loans</h1>
        </div>
        <div className="text-center py-8">Loading loans...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Loans</h1>
        <Button onClick={handleAddLoan}>
          <Plus className="h-4 w-4 mr-2" />
          Add Loan
        </Button>
      </div>

      {loans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Balance</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalBalance)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Paid</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="text-sm text-gray-500 dark:text-gray-400">Progress</div>
            <div className="text-2xl font-bold">{totalPrincipal > 0 ? Math.round((totalPaid / totalPrincipal) * 100) : 0}%</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.map((loan) => (
          <div
            key={loan.id}
            className={`transition-all duration-300 ${
              highlightedLoanId === loan.id
                ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20 rounded-lg'
                : ''
            }`}
          >
            <LoanCard
              loan={loan}
              onEdit={handleEditLoan}
              onDelete={handleDeleteLoan}
              onMakePayment={handleMakePayment}
            />
          </div>
        ))}
      </div>

      {loans.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No loans yet
          </h3>
          <p className="text-gray-500 mb-4">
            Track your loans to monitor payments and balances.
          </p>
          <Button onClick={handleAddLoan}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Loan
          </Button>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <LoanForm
            loan={editingLoan}
            onSave={handleSaveLoan}
            onCancel={handleCancelForm}
          />
        </DialogContent>
      </Dialog>

      <LoanPaymentModal
        loan={selectedLoanForPayment}
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onPaymentMade={handlePaymentMade}
      />

      <DeleteLoanDialog
        loan={loanToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteLoan}
      />
    </div>
  );
};

export default LoansPage;