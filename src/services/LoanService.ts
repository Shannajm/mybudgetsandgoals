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
  paymentsMade?: number;
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
  balance?: number; // optional override for existing loans
  paymentsMade?: number; // optional, number of already-made payments
}

class LoanService {
  private periodsPerYear(freq: string): number {
    switch (freq) {
      case 'weekly': return 52;
      case 'bi-weekly': return 26;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      default: return 12;
    }
  }

  private computeRemainingBalance(principal: number, annualRatePct: number, paymentAmount: number, paymentsMade: number, frequency: string): number {
    if (!paymentsMade || paymentsMade <= 0) return principal;
    const ppy = this.periodsPerYear(frequency);
    const r = (annualRatePct / 100) / ppy;
    if (r === 0) {
      return Math.max(0, principal - paymentAmount * paymentsMade);
    }
    const growth = Math.pow(1 + r, paymentsMade);
    const remaining = principal * growth - paymentAmount * ((growth - 1) / r);
    return Math.max(0, remaining);
  }

  private ratePerPeriod(annualRatePct: number, frequency: string): number {
    return (annualRatePct / 100) / this.periodsPerYear(frequency);
  }

  private simulateRepay(balance: number, r: number, paymentAmount: number): { periods: number; totalRepay: number; totalInterest: number } {
    let b = balance;
    let totalRepay = 0;
    let totalInterest = 0;
    let periods = 0;
    const MAX_STEPS = 2000; // safety guard (~> 38 years weekly)
    while (b > 0 && periods < MAX_STEPS) {
      const interest = b * r;
      const principalPayment = paymentAmount - interest;
      if (principalPayment <= 0) {
        // Payment too small to ever reduce balance
        return { periods: Infinity as unknown as number, totalRepay: Infinity as unknown as number, totalInterest: Infinity as unknown as number };
      }
      const actualPrincipal = Math.min(principalPayment, b);
      const actualPayment = actualPrincipal + interest;
      b -= actualPrincipal;
      totalRepay += actualPayment;
      totalInterest += interest;
      periods += 1;
    }
    return { periods, totalRepay, totalInterest };
  }

  // Public helper: projected totals for display
  computeProjections(loan: Loan): {
    totalRepay: number;
    totalInterest: number;
    remainingRepay: number;
    remainingInterest: number;
    totalPeriods: number;
    remainingPeriods: number;
  } {
    const r = this.ratePerPeriod(loan.interestRate, loan.paymentFrequency);
    const total = this.simulateRepay(loan.principal, r, loan.paymentAmount);
    const remaining = this.simulateRepay(loan.balance, r, loan.paymentAmount);
    return {
      totalRepay: total.totalRepay,
      totalInterest: total.totalRepay - loan.principal,
      remainingRepay: remaining.totalRepay,
      remainingInterest: remaining.totalRepay - loan.balance,
      totalPeriods: total.periods,
      remainingPeriods: remaining.periods,
    };
  }
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
      
      // If user provided number of payments already made, derive balance from amortization.
      // (If you want to manually set balance, omit paymentsMade.)
      let resolvedBalance = data.balance;
      if (data.paymentsMade !== undefined && data.paymentsMade > 0) {
        resolvedBalance = this.computeRemainingBalance(
          data.principal,
          data.interestRate,
          data.paymentAmount,
          data.paymentsMade,
          data.paymentFrequency
        );
      }

      const docData = {
        userId: currentUser.uid,
        name: data.name,
        principal: data.principal,
        balance: resolvedBalance !== undefined ? resolvedBalance : data.principal,
        interestRate: data.interestRate,
        paymentAmount: data.paymentAmount,
        paymentFrequency: data.paymentFrequency,
        nextDueDate: data.nextDueDate,
        currency: data.currency,
        accountId: data.accountId || '',
        ...(data.paymentsMade !== undefined && { paymentsMade: data.paymentsMade }),
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
      
      const existing = await this.getById(id);
      
      let resolvedBalance = data.balance;
      if (data.paymentsMade !== undefined && data.paymentsMade > 0) {
        const principal = data.principal !== undefined ? data.principal : (existing?.principal || 0);
        const interestRate = data.interestRate !== undefined ? data.interestRate : (existing?.interestRate || 0);
        const paymentAmount = data.paymentAmount !== undefined ? data.paymentAmount : (existing?.paymentAmount || 0);
        const frequency = data.paymentFrequency !== undefined ? data.paymentFrequency : (existing?.paymentFrequency || 'monthly');
        if (principal > 0 && paymentAmount > 0) {
          resolvedBalance = this.computeRemainingBalance(
            principal,
            interestRate,
            paymentAmount,
            data.paymentsMade,
            frequency
          );
        }
      }

      const updateData = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.principal !== undefined && { principal: data.principal }),
        ...(resolvedBalance !== undefined && { balance: resolvedBalance }),
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.paymentAmount !== undefined && { paymentAmount: data.paymentAmount }),
        ...(data.paymentFrequency !== undefined && { paymentFrequency: data.paymentFrequency }),
        ...(data.nextDueDate !== undefined && { nextDueDate: data.nextDueDate }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.accountId !== undefined && { accountId: data.accountId }),
        ...(data.paymentsMade !== undefined && { paymentsMade: data.paymentsMade }),
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
