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
  getDoc 
} from 'firebase/firestore';

export interface Loan {
  id: string;
  name: string;
  principal: number;
  balance: number;
  interestRate: number;
  paymentAmount: number;
  paymentFrequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  nextDueDate: string;
  currency: string;
  accountId?: string;
  user_id: string;
}

export interface CreateLoanData {
  name: string;
  principal: number;
  interestRate: number;
  paymentAmount: number;
  paymentFrequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  nextDueDate: string;
  currency: string;
  accountId?: string;
}

class LoanService {
  async getAll(): Promise<Loan[]> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];

      const q = query(
        collection(db, 'loans'),
        where('userId', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          currency: data.currency || 'USD'
        };
      }) as Loan[];
    } catch (error) {
      console.error('Error fetching loans:', error);
      return [];
    }
  }

  async getById(id: string): Promise<Loan | null> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      const docRef = doc(db, 'loans', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          currency: data.currency || 'USD'
        } as Loan;
      }
      return null;
    } catch (error) {
      console.error('Error fetching loan:', error);
      return null;
    }
  }

  async getSummary(): Promise<{ totalBalance: number; totalPaid: number; overallProgress: number }> {
    const allLoans = await this.getAll();
    const totalBalance = allLoans.reduce((sum, loan) => sum + loan.balance, 0);
    const totalPrincipal = allLoans.reduce((sum, loan) => sum + loan.principal, 0);
    const totalPaid = totalPrincipal - totalBalance;
    const overallProgress = totalPrincipal > 0 ? (totalPaid / totalPrincipal) * 100 : 0;
    
    return { totalBalance, totalPaid, overallProgress };
  }

  async create(data: CreateLoanData): Promise<Loan> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const docData = {
        userId: currentUser.uid,
        name: data.name,
        principal: data.principal,
        balance: data.principal,
        interestRate: data.interestRate,
        paymentAmount: data.paymentAmount,
        paymentFrequency: data.paymentFrequency,
        nextDueDate: data.nextDueDate,
        currency: data.currency,
        accountId: data.accountId || '',
        createdAt: new Date().toISOString()
      };
      
      Object.keys(docData).forEach(key => {
        if (docData[key] === undefined) {
          delete docData[key];
        }
      });

      const docRef = await addDoc(collection(db, 'loans'), docData);
      return {
        id: docRef.id,
        user_id: currentUser.uid,
        ...docData
      };
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<CreateLoanData & { balance: number }>): Promise<Loan> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      const updateData = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.principal !== undefined && { principal: data.principal }),
        ...(data.balance !== undefined && { balance: data.balance }),
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.paymentAmount !== undefined && { paymentAmount: data.paymentAmount }),
        ...(data.paymentFrequency !== undefined && { paymentFrequency: data.paymentFrequency }),
        ...(data.nextDueDate !== undefined && { nextDueDate: data.nextDueDate }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        updatedAt: new Date().toISOString()
      };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const docRef = doc(db, 'loans', id);
      await updateDoc(docRef, updateData);
      
      // Reload the loan from database to get the updated data
      const updatedLoan = await this.getById(id);
      if (!updatedLoan) {
        throw new Error('Failed to reload updated loan');
      }
      
      return updatedLoan;
    } catch (error) {
      console.error('Error updating loan:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User not authenticated');
      
      await deleteDoc(doc(db, 'loans', id));
    } catch (error) {
      console.error('Error deleting loan:', error);
      throw error;
    }
  }

  async applyPayment(loanId: string, amount: number): Promise<Loan> {
    try {
      const loan = await this.getById(loanId);
      if (!loan) throw new Error('Loan not found');
      
      const newBalance = Math.max(0, loan.balance - amount);
      
      const nextDue = new Date(loan.nextDueDate);
      if (loan.paymentFrequency === 'monthly') {
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else if (loan.paymentFrequency === 'bi-weekly') {
        nextDue.setDate(nextDue.getDate() + 14);
      } else if (loan.paymentFrequency === 'weekly') {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (loan.paymentFrequency === 'quarterly') {
        nextDue.setMonth(nextDue.getMonth() + 3);
      }
      
      const updatedLoan = await this.update(loanId, {
        balance: newBalance,
        nextDueDate: nextDue.toISOString().split('T')[0]
      });
      
      return updatedLoan;
    } catch (error) {
      console.error('Error applying payment:', error);
      throw error;
    }
  }

  async makePayment(loanId: string, amount: number, accountId: string): Promise<void> {
    await this.applyPayment(loanId, amount);
  }
}

export const loanService = new LoanService();