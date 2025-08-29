import { accountService } from './AccountService';
import { transactionService } from './TransactionService';
import { billService } from './BillService';
import { incomeService } from './IncomeService';
import { goalService } from './GoalService';
import { loanService } from './LoanService';

class DataResetService {
  async resetAllData(): Promise<void> {
    try {
      // Get all items to delete
      const [accounts, transactions, bills, incomes, goals, loans] = await Promise.all([
        accountService.getAll(),
        transactionService.getAll(),
        billService.getAll(),
        incomeService.getAll(),
        goalService.getAll(),
        loanService.getAll()
      ]);

      // Delete all data
      await Promise.all([
        ...transactions.map(t => transactionService.delete(t.id)),
        ...bills.map(b => billService.delete(b.id)),
        ...incomes.map(i => incomeService.deleteIncome(i.id)),
        ...goals.map(g => goalService.delete(g.id)),
        ...loans.map(l => loanService.delete(l.id)),
        // ensure account transactions are removed atomically with each account
        ...accounts.map(a => accountService.deleteWithTransactions(a.id))
      ]);
    } catch (error) {
      console.error('Error resetting data:', error);
      throw error;
    }
  }
}

export const dataResetService = new DataResetService();
