import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  increment,
  getDoc
} from 'firebase/firestore';
import { accountService } from './AccountService';
import { TransactionServiceUpdate } from './TransactionServiceUpdate';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer' | 'transfer_out' | 'transfer_in' | 'loan_payment' | 'bill_payment';
  date: string;
  category: string;
  accountId: string;
  loan_id?: string;
  billId?: string;
  loanId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  currency?: string;
  rate?: number;
  relatedTransactionId?: string;
  fxRate?: number;
  fxFrom?: string;
  fxTo?: string;
  convertedAmount?: number;
  created_at?: string;
  deleted?: boolean;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer' | 'loan_payment' | 'bill_payment';
  date: string;
  category: string;
  accountId?: string;
  loan_id?: string;
  billId?: string;
  loanId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  currency?: string;
  fxRate?: number;
  fxFrom?: string;
  fxTo?: string;
  convertedAmount?: number;
}

export interface CreateTransferData {
  fromId: string;
  toId: string;
  amount: number;
  rate: number;
  description: string;
  date: string;
}

export interface SpendingByCategory {
  category: string;
  total: number;
}

export interface CashFlowData {
  date: string;
  totalIncome: number;
  totalExpenses: number;
  net: number;
}

class TransactionService {
  private updateService = new TransactionServiceUpdate();

  async getAll(): Promise<Transaction[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const rows = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      const visible = rows.filter(t => !t.deleted); // Exclude soft-deleted
      return visible.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async getSpendingByCategory(period: { from: Date; to: Date }): Promise<SpendingByCategory[]> {
    try {
      const allTransactions = await this.getAll();
      const filtered = allTransactions.filter(t => {
        const txnDate = new Date(t.date);
        return t.type === 'expense' && txnDate >= period.from && txnDate <= period.to;
      });

      const categoryTotals = new Map<string, number>();
      
      filtered.forEach(t => {
        const category = t.category || 'Other';
        const current = categoryTotals.get(category) || 0;
        categoryTotals.set(category, current + Math.abs(t.amount));
      });

      return Array.from(categoryTotals.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
    } catch (error) {
      console.error('Error fetching spending data:', error);
      return [];
    }
  }

  async getCashFlow(
    period: { from: Date; to: Date },
    interval: 'daily' | 'monthly'
  ): Promise<CashFlowData[]> {
    try {
      const allTransactions = await this.getAll();
      const filtered = allTransactions.filter(t => {
        const txnDate = new Date(t.date);
        return txnDate >= period.from && txnDate <= period.to;
      });

      const groupedData = new Map<string, { income: number; expenses: number }>();

      filtered.forEach(t => {
        const date = new Date(t.date);
        const key = interval === 'daily' 
          ? date.toISOString().split('T')[0]
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!groupedData.has(key)) {
          groupedData.set(key, { income: 0, expenses: 0 });
        }

        const group = groupedData.get(key)!;
        if (t.type === 'income') {
          group.income += Math.abs(t.amount);
        } else if (t.type === 'expense' || t.type === 'loan_payment' || t.type === 'bill_payment') {
          group.expenses += Math.abs(t.amount);
        }
      });

      return Array.from(groupedData.entries())
        .map(([date, data]) => ({
          date,
          totalIncome: data.income,
          totalExpenses: data.expenses,
          net: data.income - data.expenses
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching cash flow data:', error);
      return [];
    }
  }

  private async updateAccountBalanceAtomic(accountId: string, amount: number): Promise<void> {
    try {
      const accountRef = doc(db, 'accounts', accountId);
      const accountSnap = await getDoc(accountRef);
      
      if (!accountSnap.exists()) {
        throw new Error('Account not found');
      }
      
      const account = accountSnap.data();
      
      if (account.type === 'credit') {
        await updateDoc(accountRef, {
          balance: increment(amount),
          availableCredit: increment(-amount)
        });
      } else {
        await updateDoc(accountRef, {
          balance: increment(amount)
        });
      }
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }

  async createTransfer(data: CreateTransferData): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const [fromAccount, toAccount] = await Promise.all([
        accountService.getById(data.fromId),
        accountService.getById(data.toId)
      ]);
      
      if (!fromAccount || !toAccount) {
        throw new Error('Invalid account IDs');
      }
      
      const fromCurrency = fromAccount.currency || 'USD';
      const toCurrency = toAccount.currency || 'USD';
      const convertedAmount = data.amount * data.rate;
      const isCreditPayment = toAccount.type === 'credit';
      
      const withdrawalData = {
        userId: currentUser.uid,
        description: data.description,
        amount: -data.amount,
        type: 'transfer_out',
        date: data.date,
        category: isCreditPayment ? 'Credit Card Payment' : 'Transfer',
        accountId: data.fromId,
        currency: fromCurrency,
        rate: data.rate,
        created_at: new Date().toISOString()
      };
      
      const withdrawalRef = await addDoc(collection(db, 'transactions'), withdrawalData);
      
      const depositData = {
        userId: currentUser.uid,
        description: data.description,
        amount: isCreditPayment ? -convertedAmount : convertedAmount,
        type: 'transfer_in',
        date: data.date,
        category: isCreditPayment ? 'Credit Card Payment' : 'Transfer',
        accountId: data.toId,
        currency: toCurrency,
        rate: data.rate,
        relatedTransactionId: withdrawalRef.id,
        created_at: new Date().toISOString()
      };
      
      const depositRef = await addDoc(collection(db, 'transactions'), depositData);
      
      await updateDoc(doc(db, 'transactions', withdrawalRef.id), { relatedTransactionId: depositRef.id });
      
      await this.updateAccountBalanceAtomic(data.fromId, -data.amount);
      await this.updateAccountBalanceAtomic(
        data.toId,
        isCreditPayment ? -convertedAmount : convertedAmount
      );
      
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw error;
    }
  }

  private async updateAccountBalance(accountId: string, amount: number): Promise<void> {
    const account = await accountService.getById(accountId);
    if (!account) return;

    if (account.type === 'credit') {
      const newBalance = account.balance + amount;
      const newAvailableCredit = (account.creditLimit || 0) - newBalance;
      await accountService.update(accountId, {
        currentBalance: newBalance,
        availableCredit: newAvailableCredit
      });
    } else {
      await accountService.update(accountId, {
        currentBalance: account.balance + amount
      });
    }
  }

  async create(data: CreateTransactionData): Promise<Transaction> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const docData = {
        userId: currentUser.uid,
        description: data.description,
        amount: data.amount,
        type: data.type,
        date: data.date,
        category: data.category,
        ...(data.accountId && { accountId: data.accountId }),
        ...(data.loan_id && { loan_id: data.loan_id }),
        ...(data.billId && { billId: data.billId }),
        ...(data.loanId && { loanId: data.loanId }),
        ...(data.fromAccountId && { fromAccountId: data.fromAccountId }),
        ...(data.toAccountId && { toAccountId: data.toAccountId }),
        ...(data.currency && { currency: data.currency }),
        ...(data.fxRate && { fxRate: data.fxRate }),
        ...(data.fxFrom && { fxFrom: data.fxFrom }),
        ...(data.fxTo && { fxTo: data.fxTo }),
        ...(data.convertedAmount && { convertedAmount: data.convertedAmount }),
        created_at: new Date().toISOString()
      };
      
      Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) {
          delete docData[key];
        }
      });

      const docRef = await addDoc(collection(db, 'transactions'), docData);
      
      // ––– DEBUG: balance update –––
      if (data.accountId) {
        const delta = data.type === 'income' ? data.amount : -Math.abs(data.amount);
        try {
          console.log('[BALANCE] about to bump account', docData.accountId, 'by', delta);
          await updateDoc(doc(db, 'accounts', docData.accountId!), {
            balance: increment(delta)
          });
          console.log('[BALANCE] updateDoc succeeded');
        } catch (err) {
          console.error('[BALANCE] updateDoc failed:', err);
        }
      }
      // ––– end debug –––
      
      return {
        id: docRef.id,
        user_id: currentUser.uid,
        ...docData
      } as Transaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateTransactionData>): Promise<Transaction> {
    return this.updateService.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.updateService.delete(id);
  }

  async deleteByAccountId(accountId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const q = query(
        collection(db, 'transactions'),
        where('accountId', '==', accountId),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting transactions by account:', error);
      throw error;
    }
  }
}

export const transactionService = new TransactionService();
