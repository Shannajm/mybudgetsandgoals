// src/services/DataResetService.ts
import { accountService } from './AccountService';
import { transactionService } from './TransactionService';
import { billService } from './BillService';
import { incomeService } from './IncomeService';
import { goalService } from './GoalService';
import { loanService } from './LoanService';

function chunk<T>(arr: T[], size = 20): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function runChunked(label: string, tasks: Array<() => Promise<any>>, size = 20) {
  for (const group of chunk(tasks, size)) {
    const results = await Promise.allSettled(group.map((fn) => fn()));
    const failed = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    if (failed.length) {
      console.error(`[reset] ${label}: ${failed.length} failed`, failed.map(f => f.reason));
      // continue; we don't abort the whole reset if a few items fail
    }
  }
}

class DataResetService {
  async resetAllData(): Promise<void> {
    // 1) Load everything for the current user
    const [accounts, transactions, bills, incomes, goals, loans] = await Promise.all([
      accountService.getAll(),
      transactionService.getAll(),
      billService.getAll(),
      incomeService.getAll(),
      goalService.getAll(),
      loanService.getAll(),
    ]);

    // 2) Delete in a safe order (transactions first, accounts last)
    await runChunked(
      'transactions',
      transactions.map((t) => () => transactionService.delete(t.id))
    );

    await runChunked('bills', bills.map((b) => () => billService.delete(b.id)));
    await runChunked('incomes', incomes.map((i) => () => incomeService.delete(i.id)));
    await runChunked('goals', goals.map((g) => () => goalService.delete(g.id)));
    await runChunked('loans', loans.map((l) => () => loanService.delete(l.id)));

    // accounts last (after their transactions are gone)
    await runChunked('accounts', accounts.map((a) => () => accountService.delete(a.id)));
  }
}

export const dataResetService = new DataResetService();
