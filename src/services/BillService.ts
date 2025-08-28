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
import { loanService } from './LoanService';
import { accountService } from './AccountService';

export type Frequency = 'one-time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  frequency: Frequency;
  category: string;
  accountId: string;
  source: 'bill' | 'loan';
  currency: string;
  status?: 'upcoming' | 'due-soon' | 'overdue' | 'paid';
  fxRate?: number;
  convertedAmount?: number;
}

export interface CreateBillData {
  name: string;
  amount: number;
  category: string;
  dueDate: string;
  frequency: Frequency;
  accountId: string;
  currency: string;
  fxRate?: number;
  convertedAmount?: number;
}

class BillService {
  private calculateStatus(dueDate: string): 'upcoming' | 'due-soon' | 'overdue' | 'paid' {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return 'upcoming';
  }

  private computeNextDue(nextDueDate: string, frequency: string): string {
    const date = new Date(nextDueDate);
    const today = new Date();
    
    while (date < today) {
      switch (frequency) {
        case 'weekly':
          date.setDate(date.getDate() + 7);
          break;
        case 'bi-weekly':
          date.setDate(date.getDate() + 14);
          break;
        case 'monthly':
          date.setMonth(date.getMonth() + 1);
          break;
        case 'quarterly':
          date.setMonth(date.getMonth() + 3);
          break;
        case 'yearly':
          date.setFullYear(date.getFullYear() + 1);
          break;
        default:
          return nextDueDate;
      }
    }
    
    return date.toISOString().split('T')[0];
  }

  async getAll(): Promise<Bill[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const billsQuery = query(
        collection(db, 'bills'),
        where('userId', '==', currentUser.uid)
      );
      const billsSnapshot = await getDocs(billsQuery);
      const bills = await Promise.all(billsSnapshot.docs.map(async doc => {
        const data = doc.data();
        let currency = data.currency;
        
        if (!currency) {
          const account = await accountService.getById(data.accountId);
          currency = account?.currency || 'USD';
        }
        
        return {
          id: doc.id,
          title: data.name,
          amount: data.amount,
          dueDate: data.dueDate,
          frequency: data.frequency,
          category: data.category,
          accountId: data.accountId,
          source: 'bill' as const,
          currency,
          status: this.calculateStatus(data.dueDate),
          fxRate: data.fxRate,
          convertedAmount: data.convertedAmount
        };
      }));

      const loans = await loanService.getAll();
      const loanBills = loans.map(loan => {
        const nextDue = this.computeNextDue(loan.nextDueDate, loan.paymentFrequency);
        return {
          id: loan.id,
          title: loan.name,
          amount: loan.paymentAmount,
          dueDate: nextDue,
          frequency: loan.paymentFrequency === 'bi-weekly' ? 'monthly' : loan.paymentFrequency as Frequency,
          category: 'Loans',
          accountId: loan.accountId || '',
          source: 'loan' as const,
          currency: loan.currency || 'USD',
          status: this.calculateStatus(nextDue)
        };
      });

      const allBills = [...bills, ...loanBills];
      return allBills.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    } catch (error) {
      console.error('Error fetching bills:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Bill | null> {
    try {
      if (!id || typeof id !== 'string') {
        console.error('Invalid bill ID provided:', id);
        return null;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      const docRef = doc(db, 'bills', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        let currency = data.currency;
        
        if (!currency) {
          const account = await accountService.getById(data.accountId);
          currency = account?.currency || 'USD';
        }
        
        return {
          id: docSnap.id,
          title: data.name,
          amount: data.amount,
          dueDate: data.dueDate,
          frequency: data.frequency,
          category: data.category,
          accountId: data.accountId,
          source: 'bill',
          currency,
          status: this.calculateStatus(data.dueDate),
          fxRate: data.fxRate,
          convertedAmount: data.convertedAmount
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching bill:', error);
      return null;
    }
  }

  async create(data: CreateBillData): Promise<Bill> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const docData = {
        userId: currentUser.uid,
        name: data.name,
        amount: data.amount,
        category: data.category,
        dueDate: data.dueDate,
        frequency: data.frequency,
        accountId: data.accountId,
        currency: data.currency || 'USD',
        fxRate: data.fxRate || 1,
        convertedAmount: data.convertedAmount,
        createdAt: new Date().toISOString()
      };
      
      // Remove undefined values
      Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) {
          delete docData[key];
        }
      });
      
      const docRef = await addDoc(collection(db, 'bills'), docData);
      
      return {
        id: docRef.id,
        title: data.name,
        amount: data.amount,
        dueDate: data.dueDate,
        frequency: data.frequency,
        category: data.category,
        accountId: data.accountId,
        source: 'bill',
        currency: data.currency || 'USD',
        status: this.calculateStatus(data.dueDate),
        fxRate: data.fxRate || 1,
        convertedAmount: data.convertedAmount
      };
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateBillData & { nextDueDate?: string }>): Promise<Bill> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Build update data object without userId
      const updateData: any = {};
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.nextDueDate !== undefined) updateData.dueDate = data.nextDueDate;
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.accountId !== undefined) updateData.accountId = data.accountId;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.fxRate !== undefined) updateData.fxRate = data.fxRate;
      if (data.convertedAmount !== undefined) updateData.convertedAmount = data.convertedAmount;
      
      updateData.updatedAt = new Date().toISOString();
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      const docRef = doc(db, 'bills', id);
      await updateDoc(docRef, updateData);
      
      const finalDueDate = data.nextDueDate || data.dueDate || '';
      
      return { 
        id, 
        title: data.name || '',
        amount: data.amount || 0,
        dueDate: finalDueDate,
        frequency: data.frequency || 'monthly',
        category: data.category || '',
        accountId: data.accountId || '',
        source: 'bill',
        currency: data.currency || 'USD',
        status: this.calculateStatus(finalDueDate),
        fxRate: data.fxRate || 1,
        convertedAmount: data.convertedAmount
      };
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  async payBill(billId: string, accountId: string, amount: number, date: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Build update data object without userId
      const updateData: any = {
        lastPaidDate: date,
        status: 'paid',
        updatedAt: new Date().toISOString()
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      const docRef = doc(db, 'bills', billId);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error paying bill:', error);
      throw error;
    }
  }

  async processBillPayment(billId: string, paymentData: any): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      // Build update data object without userId
      const updateData: any = {
        lastPaidDate: paymentData.date,
        lastPaidAmount: paymentData.amount,
        status: 'paid',
        updatedAt: new Date().toISOString()
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      const docRef = doc(db, 'bills', billId);
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error processing bill payment:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      await deleteDoc(doc(db, 'bills', id));
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }
}

export const billService = new BillService();