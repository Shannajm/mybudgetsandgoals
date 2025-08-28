import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';

export interface Income {
  id: string;
  sourceName: string;
  amount: number;
  frequency: 'One-time' | 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  nextPaymentDate: string;
  accountId: string;
  description?: string;
  userId: string;
  createdAt: string;
}

export interface CreateIncomeData {
  sourceName: string;
  amount: number;
  frequency: 'One-time' | 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  nextPaymentDate: string;
  accountId: string;
  description?: string;
}

class IncomeService {
  async getAll(): Promise<Income[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const q = query(collection(db, 'incomes'), where('userId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Income[];
    } catch (error) {
      console.error('Error fetching incomes:', error);
      throw error;
    }
  }

  async createIncome(data: CreateIncomeData): Promise<Income> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const docData = {
        userId: currentUser.uid,
        sourceName: data.sourceName,
        amount: data.amount,
        frequency: data.frequency,
        nextPaymentDate: data.nextPaymentDate,
        accountId: data.accountId,
        description: data.description || '',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'incomes'), docData);
      return { id: docRef.id, ...docData };
    } catch (error) {
      console.error('Error creating income:', error);
      throw error;
    }
  }

  async updateIncome(income: Income): Promise<Income> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const updateData = {
        sourceName: income.sourceName,
        amount: income.amount,
        frequency: income.frequency,
        nextPaymentDate: income.nextPaymentDate,
        accountId: income.accountId,
        description: income.description || '',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'incomes', income.id), updateData);
      return { ...income, ...updateData };
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  }

  async deleteIncome(id: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      await deleteDoc(doc(db, 'incomes', id));
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  }

  async getMonthlyTotal(): Promise<number> {
    try {
      const incomes = await this.getAll();
      return incomes.reduce((total, income) => {
        let monthlyAmount = income.amount;
        switch (income.frequency) {
          case 'Weekly':
            monthlyAmount = income.amount * 4.33;
            break;
          case 'Bi-weekly':
            monthlyAmount = income.amount * 2.17;
            break;
          case 'Quarterly':
            monthlyAmount = income.amount / 3;
            break;
          case 'Yearly':
            monthlyAmount = income.amount / 12;
            break;
          case 'One-time':
            monthlyAmount = 0;
            break;
        }
        return total + monthlyAmount;
      }, 0);
    } catch (error) {
      console.error('Error calculating monthly total:', error);
      return 0;
    }
  }
}

export const incomeService = new IncomeService();