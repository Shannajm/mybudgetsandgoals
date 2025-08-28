import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit';
  currency: string;
  balance: number;
  currentBalance?: number;
  creditLimit?: number;
  availableCredit?: number;
  user_id: string;
  // Credit card statement fields
  statementDate?: number;
  statementDueDate?: number;
  statementAmount?: number;
}

export interface CreateAccountData {
  name: string;
  type: 'checking' | 'savings' | 'credit';
  currency: string;
  currentBalance?: number;
  creditLimit?: number;
  availableCredit?: number;
  statementDate?: number;
  statementDueDate?: number;
  statementAmount?: number;
}

export interface StatementStatus {
  statementAmount: number;
  amountPaidThisCycle: number;
  owedOnStatement: number;
  statementDueDate: number;
}

class AccountService {
  private computeCurrentBalance(account: Account): number {
    if (account.type === 'credit' && account.creditLimit && account.availableCredit !== undefined) {
      return account.creditLimit - account.availableCredit;
    }
    return account.balance;
  }

  async getStatementStatus(accountId: string): Promise<StatementStatus | null> {
    try {
      const account = await this.getById(accountId);
      if (!account || account.type !== 'credit' || !account.statementDate || !account.statementAmount) {
        return null;
      }

      const { transactionService } = await import('./TransactionService');
      const transactions = await transactionService.getAll();
      
      // Calculate last statement date
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let lastStatementDate = new Date(currentYear, currentMonth, account.statementDate);
      if (lastStatementDate > now) {
        lastStatementDate = new Date(currentYear, currentMonth - 1, account.statementDate);
      }

      // Find payments since last statement
      const payments = transactions.filter(t => 
        t.accountId === accountId &&
        t.amount < 0 &&
        t.category === 'Credit Card Payment' &&
        new Date(t.date) >= lastStatementDate &&
        new Date(t.date) <= now
      );

      const amountPaidThisCycle = Math.abs(payments.reduce((sum, p) => sum + p.amount, 0));
      const owedOnStatement = Math.max(0, account.statementAmount - amountPaidThisCycle);

      return {
        statementAmount: account.statementAmount,
        amountPaidThisCycle,
        owedOnStatement,
        statementDueDate: account.statementDueDate || 0
      };
    } catch (error) {
      console.error('Error getting statement status:', error);
      return null;
    }
  }

  async getAll(): Promise<Account[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        collection(db, 'accounts'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const accounts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Account[];

      return accounts.map(account => ({
        ...account,
        currentBalance: this.computeCurrentBalance(account)
      }));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Account | null> {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid account ID');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      const docRef = doc(db, 'accounts', String(id).trim());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const account = { id: docSnap.id, ...docSnap.data() } as Account;
        return {
          ...account,
          currentBalance: this.computeCurrentBalance(account)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching account:', error);
      return null;
    }
  }

  async create(data: CreateAccountData): Promise<Account> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      let balance = 0;
      if (data.type === 'credit') {
        balance = (data.creditLimit || 0) - (data.availableCredit || 0);
      } else {
        balance = data.currentBalance || 0;
      }
      
      const docData = {
        userId: currentUser.uid,
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance,
        ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
        ...(data.availableCredit !== undefined && { availableCredit: data.availableCredit }),
        ...(data.statementDate !== undefined && { statementDate: data.statementDate }),
        ...(data.statementDueDate !== undefined && { statementDueDate: data.statementDueDate }),
        ...(data.statementAmount !== undefined && { statementAmount: data.statementAmount }),
        createdAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'accounts'), docData);
      const newAccount: Account = {
        id: docRef.id,
        user_id: currentUser.uid,
        ...docData
      };
      newAccount.currentBalance = this.computeCurrentBalance(newAccount);
      return newAccount;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateAccountData & { currentBalance: number }>): Promise<Account> {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid account ID');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const updateData: any = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.currentBalance !== undefined && { balance: data.currentBalance }),
        ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
        ...(data.availableCredit !== undefined && { availableCredit: data.availableCredit }),
        ...(data.statementDate !== undefined && { statementDate: data.statementDate }),
        ...(data.statementDueDate !== undefined && { statementDueDate: data.statementDueDate }),
        ...(data.statementAmount !== undefined && { statementAmount: data.statementAmount }),
        updatedAt: new Date().toISOString()
      };

      const docRef = doc(db, 'accounts', String(id).trim());
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        const account = { id: updatedDoc.id, ...updatedDoc.data() } as Account;
        account.currentBalance = this.computeCurrentBalance(account);
        return account;
      }
      
      throw new Error('Account not found');
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('Invalid account ID');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      await deleteDoc(doc(db, 'accounts', String(id).trim()));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async deleteWithTransactions(id: string): Promise<void> {
    try {
      const { transactionService } = await import('./TransactionService');
      await transactionService.deleteByAccountId(id);
      await this.delete(id);
    } catch (error) {
      console.error('Error deleting account with transactions:', error);
      throw error;
    }
  }
}

export const accountService = new AccountService();